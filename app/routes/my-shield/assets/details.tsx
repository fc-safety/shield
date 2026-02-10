import type { ColumnDef } from "@tanstack/react-table";
import { isValid, parseISO } from "date-fns";
import {
  CircleAlert,
  Nfc,
  Package,
  Pencil,
  Plus,
  RouteIcon,
  Shield,
  SquareStack,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { useMemo, type PropsWithChildren } from "react";
import { Link, useNavigate, type ShouldRevalidateFunctionArgs, type UIMatch } from "react-router";
import { toast } from "sonner";
import { ApiFetcher } from "~/.server/api-utils";
import { buildImageProxyUrl } from "~/.server/images";
import { AlertsStatusBadge, InspectionStatusBadge } from "~/components/assets/asset-status-badge";
import EditAssetButton from "~/components/assets/edit-asset-button";
import EditConsumableButton from "~/components/assets/edit-consumable-button";
import EditableTagDisplay from "~/components/assets/editable-tag-display";
import ProductRequests, { NewSupplyRequestButton } from "~/components/assets/product-requests";
import HydrationSafeFormattedDate from "~/components/common/hydration-safe-formatted-date";
import ResponsiveActions from "~/components/common/responsive-actions";
import ConfirmationDialog from "~/components/confirmation-dialog";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import DisplayRelativeDate from "~/components/display-relative-date";
import Icon from "~/components/icons/icon";
import EditRoutePointButton from "~/components/inspections/edit-route-point-button";
import { AnsiCategoryDisplay } from "~/components/products/ansi-category-combobox";
import { ProductImage } from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import { getAssetAlertsStatus, getAssetInspectionStatus } from "~/lib/model-utils";
import type { Asset, Consumable } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { can } from "~/lib/users";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";
import AlertsCard from "./components/alerts-card";
import InspectionsCard from "./components/inspections-card";

// When deleting an asset, we don't want to revalidate the page. This would
// cause a 404 before the page could navigate back.
export const shouldRevalidate = ({
  formAction,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
  if (formMethod === "DELETE" && formAction && formAction.startsWith("/api/proxy/assets")) {
    return false;
  }
  return defaultShouldRevalidate;
};

export const handle = {
  breadcrumb: ({
    loaderData,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["loaderData"] | undefined>) => ({
    label: loaderData?.asset.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  const asset = await ApiFetcher.create(request, "/assets/:id", {
    id,
  }).get<Asset>();
  return {
    asset,
    processedProductImageUrl:
      asset.product.imageUrl && buildImageProxyUrl(asset.product.imageUrl, ["rs:fit:250:250:1:1"]),
  };
};

export default function AssetDetails({
  loaderData: { asset, processedProductImageUrl },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canManageAssets = can(user, CAPABILITIES.MANAGE_ASSETS);
  const canReadInspections = can(user, CAPABILITIES.PERFORM_INSPECTIONS);
  const canUpdateRoutes = can(user, CAPABILITIES.MANAGE_ROUTES);
  const canCreateProductRequests = can(user, CAPABILITIES.SUBMIT_REQUESTS);

  const navigate = useNavigate();

  const { submitJson: submitDelete } = useModalFetcher({
    onSubmitted: () => {
      navigate(`../`);
    },
  });
  const [deleteAssetAction, setDeleteAssetAction] = useConfirmAction({
    variant: "destructive",
    defaultProps: {
      title: "Delete Asset",
    },
  });

  const handleDeleteAsset = (asset: Asset) => {
    setDeleteAssetAction((draft) => {
      draft.open = true;
      draft.message = `Are you sure you want to delete ${asset.name ? `"${asset.name}"` : `this asset`}?`;
      draft.requiredUserInput = asset.name ?? asset.serialNumber;
      draft.onConfirm = () => {
        submitDelete(
          {},
          {
            method: "delete",
            path: `/api/proxy/assets/${asset.id}`,
          }
        );
      };
    });
  };

  return (
    <div className="@container">
      <div className="grid w-full grid-cols-1 gap-x-2 gap-y-4 @4xl:grid-cols-[1fr_400px]">
        <div className="flex min-w-0 flex-col gap-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex-wrap gap-x-4">
                <div className="flex items-center gap-2">
                  <Shield />
                  {asset.name || `Asset: ${asset.product.name}`}
                  {asset.product.productCategory.icon && (
                    <Icon
                      iconId={asset.product.productCategory.icon}
                      color={asset.product.productCategory.color}
                      className="text-base"
                    />
                  )}
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                  <InspectionStatusBadge
                    className="shrink-0"
                    status={
                      asset.inspections &&
                      getAssetInspectionStatus(
                        asset.inspections,
                        asset.inspectionCycle ?? asset.client?.defaultInspectionCycle
                      )
                    }
                  />
                  <AlertsStatusBadge
                    className="shrink-0"
                    status={getAssetAlertsStatus(asset.alerts ?? [])}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="@container">
              <div className="flex flex-col gap-5 @md:grid @md:grid-cols-[1fr_auto]">
                <div className="grid h-max grid-cols-[auto_1fr] gap-5">
                  <DataList
                    title="Properties"
                    classNames={{
                      container: "grid-cols-subgrid col-span-2 gap-3",
                      details: "grid-cols-subgrid col-span-2 gap-y-1.5",
                    }}
                    details={[
                      {
                        label: "Nickname",
                        value: asset.name,
                      },
                      {
                        label: "Serial No.",
                        value: asset.serialNumber,
                      },
                      {
                        label: "Metadata",
                        value:
                          asset.metadata && Object.keys(asset.metadata).length > 0 ? (
                            <div className="flex flex-col flex-wrap gap-2">
                              {Object.entries(asset.metadata ?? {}).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="flex w-max overflow-hidden rounded-full border border-gray-500 text-xs dark:border-gray-400"
                                >
                                  <div className="bg-gray-500 px-2 py-1 font-medium text-white dark:bg-gray-400 dark:text-gray-900">
                                    {key}
                                  </div>
                                  <div className="px-2 py-1">{value}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No metadata.</span>
                          ),
                      },
                      {
                        label: "Inspection Cycle",
                        value: asset.inspectionCycle
                          ? `${asset.inspectionCycle} days`
                          : asset.client?.defaultInspectionCycle
                            ? `${asset.client?.defaultInspectionCycle} days (client default)`
                            : null,
                      },
                      {
                        label: "Setup Completed",
                        value: asset.setupOn && (
                          <HydrationSafeFormattedDate date={asset.setupOn} formatStr="PPpp" />
                        ),
                      },
                    ]}
                    defaultValue={<>&mdash;</>}
                  />
                  <DataList
                    title="Location"
                    classNames={{
                      container: "grid-cols-subgrid col-span-2 gap-3",
                      details: "grid-cols-subgrid col-span-2 gap-y-1.5",
                    }}
                    details={[
                      {
                        label: "Site",
                        value: asset.site?.name,
                      },
                      {
                        label: "Room / Area",
                        value: asset.location,
                      },
                      {
                        label: "Placement",
                        value: asset.placement,
                      },
                    ]}
                  />

                  <DataList
                    title="Other"
                    classNames={{
                      container: "grid-cols-subgrid col-span-2 gap-3",
                      details: "grid-cols-subgrid col-span-2 gap-y-1.5",
                    }}
                    details={[
                      {
                        label: "Created",
                        value: (
                          <HydrationSafeFormattedDate date={asset.createdOn} formatStr="PPpp" />
                        ),
                      },
                      {
                        label: "Last Updated",
                        value: (
                          <HydrationSafeFormattedDate date={asset.modifiedOn} formatStr="PPpp" />
                        ),
                      },
                    ]}
                    defaultValue={<>&mdash;</>}
                  />
                </div>

                <div>
                  <Label className="mb-3 block @md:hidden">Product</Label>
                  <Card className="flex @md:w-52 @md:flex-col @xl:w-56">
                    <ProductImage
                      name="Product Image"
                      imageUrl={processedProductImageUrl}
                      className="min-h-24 @md:h-36 @md:min-h-36 @md:w-full @md:rounded-tr-xl @md:rounded-bl-none @md:border-r-0 @md:border-b @md:sm:w-full"
                    />
                    <div className="flex grow flex-col self-stretch">
                      <CardHeader className="grow p-2 sm:p-4">
                        <CardTitle className="flex h-full flex-col items-start gap-1">
                          <span className="text-muted-foreground text-xs">
                            {asset.product.manufacturer.name}
                          </span>

                          <span>{asset.product.name}</span>
                          {asset.product.sku && (
                            <span className="text-muted-foreground text-xs font-light">
                              SKU: {asset.product.sku}
                            </span>
                          )}
                          <div className="flex-1"></div>
                          <div className="bg-secondary border-border mt-2 flex w-max items-center gap-2 rounded-md border p-1.5 text-sm">
                            <Nfc className="text-primary size-4" />
                            <EditableTagDisplay asset={asset} tag={asset.tag} />
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </div>
                  </Card>
                </div>

                <ButtonGroup className="col-span-2">
                  {canManageAssets && (
                    <ButtonGroup>
                      <EditAssetButton
                        asset={asset}
                        trigger={
                          <Button variant="outline" size="sm" type="button">
                            <Pencil /> Edit
                          </Button>
                        }
                      />
                    </ButtonGroup>
                  )}
                  {canManageAssets && (
                    <ButtonGroup>
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => handleDeleteAsset(asset)}
                      >
                        <Trash /> Delete
                      </Button>
                    </ButtonGroup>
                  )}
                </ButtonGroup>
              </div>
            </CardContent>
          </Card>

          <div>
            <Card className="rounded-b-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package />
                    Recent Requests
                  </div>
                  {canCreateProductRequests && (
                    <NewSupplyRequestButton
                      assetId={asset.id}
                      parentProductId={asset.productId}
                      onSuccess={() => {
                        toast.success(
                          <div className="flex flex-col gap-2">
                            <p>
                              Your request was submitted! An FC Safety representative will reach out
                              to your organization shortly.
                            </p>
                            <p>
                              You can view recent requests in your{" "}
                              <Link to="/dashboard" className="text-primary font-semibold">
                                dashboard
                              </Link>
                              .
                            </p>
                          </div>,
                          { duration: 10000 }
                        );
                      }}
                    />
                  )}
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductRequests productRequests={asset.productRequests ?? []} />
              </CardContent>
            </Card>
            <BasicCard title="Supplies" className="rounded-t-none border-t-0" icon={SquareStack}>
              <ConsumablesTable consumables={asset.consumables ?? []} asset={asset} />
            </BasicCard>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <AlertsCard alerts={asset.alerts ?? []} assetId={asset.id} />

          <Card>
            <CardHeader className="pb-2 sm:pb-2">
              <CardTitle className="flex items-center">
                <RouteIcon />
                Routes
                <div className="flex-1"></div>
                {canUpdateRoutes && (
                  <EditRoutePointButton
                    asset={asset}
                    filterRoute={(r) =>
                      !asset.inspectionRoutePoints?.some((p) => p.inspectionRouteId === r.id)
                    }
                    trigger={
                      <Button variant="default" size="sm" className="shrink-0">
                        <Plus />
                        Add to Route
                      </Button>
                    }
                  />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.inspectionRoutePoints && asset.inspectionRoutePoints.length > 1 && (
                <p className="text-muted-foreground flex items-center gap-1 text-xs italic">
                  <CircleAlert className="size-4" />
                  This asset belongs to multiple routes.
                </p>
              )}
              {asset.inspectionRoutePoints?.length ? (
                <div className="divide-border grid divide-y">
                  {asset.inspectionRoutePoints.map((point) => (
                    <div key={point.id} className="flex items-center gap-3 py-2">
                      <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {point.order + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-semibold">Name</span>
                        <Link
                          to={`/inspection-routes/#route-id-${point.inspectionRouteId}`}
                          className="text-sm hover:underline"
                        >
                          {point.inspectionRoute?.name ?? "Unknown Route"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground h-full py-2 text-center text-xs">
                  No route has been configured yet for this asset.
                </p>
              )}
            </CardContent>
          </Card>
          {canReadInspections && (
            <InspectionsCard inspections={asset.inspections ?? []} asset={asset} />
          )}
        </div>
      </div>
      <ConfirmationDialog {...deleteAssetAction} />
    </div>
  );
}

function BasicCard({
  title,
  description,
  icon: IconComponent,
  className,
  children,
}: PropsWithChildren<{
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {IconComponent && <IconComponent />} {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ConsumablesTable({ consumables, asset }: { consumables: Consumable[]; asset: Asset }) {
  const { user } = useAuth();
  const canManageConsumables = can(user, CAPABILITIES.MANAGE_ASSETS);

  const editConsumable = useOpenData<Consumable>();

  const { submit: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete consumable",
  });

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const columns = useMemo<ColumnDef<Consumable>[]>(
    () => [
      {
        accessorKey: "product.name",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "expiresOn",
        id: "expires",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value && isValid(parseISO(value)) ? (
            <DisplayRelativeDate date={value} />
          ) : (
            <>&mdash;</>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "product.ansiCategory.name",
        id: "ansiCategory",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="ANSI" />
        ),
        cell: ({ row }) =>
          row.original.product.ansiCategory ? (
            <AnsiCategoryDisplay ansiCategory={row.original.product.ansiCategory} />
          ) : (
            <>&mdash;</>
          ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const consumable = row.original;

          return (
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "edit",
                      text: "Edit",
                      Icon: Pencil,
                      disabled: !canManageConsumables,
                      onAction: () => editConsumable.openData(consumable),
                    },
                  ],
                },
                {
                  key: "destructive-actions",
                  variant: "destructive",
                  actions: [
                    {
                      key: "delete",
                      text: "Delete",
                      Icon: Trash,
                      disabled: !canManageConsumables,
                      variant: "destructive",
                      onAction: () =>
                        setDeleteAction((draft) => {
                          draft.open = true;
                          draft.title = "Delete Supply";
                          draft.message = `Are you sure you want to remove ${consumable.product.name} from this asset?`;
                          draft.onConfirm = () => {
                            submitDelete(
                              {},
                              {
                                method: "delete",
                                action: `/api/proxy/consumables/${consumable.id}`,
                              }
                            );
                          };
                        }),
                    },
                  ],
                },
              ]}
            />
          );
        },
      },
    ],
    [setDeleteAction, submitDelete, editConsumable, canManageConsumables]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={consumables}
        initialState={{
          columnVisibility: {
            actions: canManageConsumables,
            ansiCategory: consumables.some((c) => !!c.product?.ansiCategory),
          },
        }}
        classNames={{
          container: "max-w-full min-w-0",
        }}
        searchPlaceholder="Search supplies..."
        actions={
          canManageConsumables
            ? [
                <EditConsumableButton
                  key="add"
                  assetId={asset.id}
                  parentProductId={asset.productId}
                />,
              ]
            : undefined
        }
      />
      {editConsumable.data && (
        <EditConsumableButton
          open={editConsumable.open}
          onOpenChange={editConsumable.setOpen}
          consumable={editConsumable.data}
          assetId={asset.id}
          parentProductId={asset.productId}
          trigger={null}
        />
      )}
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
