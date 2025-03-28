import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import {
  Check,
  CircleAlert,
  ClipboardCheck,
  CornerDownRight,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Route as RouteIcon,
  SearchCheck,
  Shield,
  ShieldAlert,
  SquareStack,
  Thermometer,
  Trash,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, type PropsWithChildren } from "react";
import { Link, type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator from "~/components/active-indicator";
import AssetInspectionAlert from "~/components/assets/asset-inspection-alert";
import AssetInspections from "~/components/assets/asset-inspections";
import {
  AlertsStatusBadge,
  InspectionStatusBadge,
} from "~/components/assets/asset-status-badge";
import DisplayInspectionValue from "~/components/assets/display-inspection-value";
import EditAssetButton from "~/components/assets/edit-asset-button";
import EditConsumableButton from "~/components/assets/edit-consumable-button";
import ProductRequests, {
  NewSupplyRequestButton,
} from "~/components/assets/product-requests";
import { TagCard } from "~/components/assets/tag-selector";
import ConfirmationDialog from "~/components/confirmation-dialog";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import EditRoutePointButton from "~/components/inspections/edit-route-point-button";
import { AnsiCategoryDisplay } from "~/components/products/ansi-category-combobox";
import ProductCard from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import {
  getAssetAlertsStatus,
  getAssetInspectionStatus,
} from "~/lib/model-utils";
import type { Alert, Asset, Consumable } from "~/lib/models";
import { updateAssetSchema, updateAssetSchemaResolver } from "~/lib/schema";
import { can } from "~/lib/users";
import {
  buildTitleFromBreadcrumb,
  dateSort,
  getSearchParam,
  getValidatedFormDataOrThrow,
  validateParam,
} from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.asset.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const id = validateParam(params, "id");

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateAssetSchema>
    >(request, updateAssetSchemaResolver);

    return api.assets.update(request, id, data);
  } else if (request.method === "DELETE") {
    return api.assets.deleteAndRedirect(request, id, "/assets");
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  return api.assets.get(request, id).mapTo((asset) => ({
    asset,
    defaultTab: getSearchParam(request, "tab") ?? "consumables",
  }));
};

export default function AssetDetails({
  loaderData: { asset, defaultTab },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canUpdate = can(user, "update", "assets");
  const canReadInspections = can(user, "read", "inspections");
  const canUpdateRoutes = can(user, "update", "inspection-routes");
  const canCreateProductRequests = can(user, "create", "product-requests");

  return (
    <div className="grid gap-y-4 gap-x-2 sm:gap-x-4">
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] gap-y-4 gap-x-2 sm:gap-x-4">
        <StatusCard asset={asset} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RouteIcon />
              Inspection Route
              <div className="flex-1"></div>
              {canUpdateRoutes && (
                <EditRoutePointButton
                  asset={asset}
                  filterRoute={(r) =>
                    !asset.inspectionRoutePoints?.some(
                      (p) => p.inspectionRouteId === r.id
                    )
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
            {asset.inspectionRoutePoints &&
              asset.inspectionRoutePoints.length > 1 && (
                <p className="text-muted-foreground text-xs flex items-center gap-1 italic">
                  <CircleAlert className="size-4" />
                  This asset belongs to multiple routes.
                </p>
              )}
            {asset.inspectionRoutePoints?.length ? (
              <div className="grid divide-y divide-border">
                {asset.inspectionRoutePoints.map((point) => (
                  <div key={point.id} className="flex gap-3 items-center py-2">
                    <div className="text-xs font-semibold rounded-full size-7 shrink-0 flex items-center justify-center bg-primary text-primary-foreground">
                      {point.order + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Name
                      </span>
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
              <p className="text-muted-foreground text-xs">
                No route has been configured yet for this asset.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-y-4 gap-x-2 sm:gap-x-4">
        <Card className="h-max">
          <CardHeader>
            <CardTitle>
              <Shield />
              <div className="inline-flex items-center gap-4">
                Asset Details
                <div className="flex gap-2">
                  {canUpdate && (
                    <EditAssetButton
                      asset={asset}
                      trigger={
                        <Button variant="secondary" size="icon" type="button">
                          <Pencil />
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
              <div className="flex-1"></div>
              <ActiveIndicator active={asset.active} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="grid gap-4">
              <Label>Properties</Label>
              <DataList
                details={[
                  {
                    label: "Name",
                    value: asset.name,
                  },
                  {
                    label: "Serial No.",
                    value: asset.serialNumber,
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
                    value: asset.setupOn && format(asset.setupOn, "PPpp"),
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
            <div className="grid gap-4">
              <Label>Location</Label>
              <DataList
                details={[
                  {
                    label: "Site",
                    value: asset.site?.name,
                  },
                  {
                    label: "Location",
                    value: asset.location,
                  },
                  {
                    label: "Placement",
                    value: asset.placement,
                  },
                ]}
              />
            </div>
            <div className="grid gap-4">
              <Label>Setup Questions</Label>
              {asset.setupOn ? (
                asset.setupQuestionResponses?.length ? (
                  <DataList
                    details={
                      asset.setupQuestionResponses?.map((r) => ({
                        label: r.assetQuestion?.prompt ?? (
                          <span className="italic">
                            Prompt for this question has been removed or is not
                            available.
                          </span>
                        ),
                        value: <DisplayInspectionValue value={r.value} />,
                      })) ?? []
                    }
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    The setup process is complete for this asset, but there are
                    no setup questions to display.
                  </span>
                )
              ) : (
                <span className="text-sm text-muted-foreground">
                  The setup process has not been completed yet for this asset.
                </span>
              )}
            </div>
            <div className="grid gap-4">
              <Label>Product</Label>
              <ProductCard product={asset.product} />
            </div>
            <div className="grid gap-4">
              <Label>Tag</Label>
              {asset.tag ? (
                <TagCard tag={asset.tag} />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No tag has been assigned to this asset.
                </span>
              )}
            </div>
            <div className="grid gap-4">
              <Label>Other</Label>
              <DataList
                details={[
                  {
                    label: "Created",
                    value: format(asset.createdOn, "PPpp"),
                  },
                  {
                    label: "Last Updated",
                    value: format(asset.modifiedOn, "PPpp"),
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
          </CardContent>
        </Card>
        <Tabs defaultValue={defaultTab} id="tabs">
          <TabsList className="grid w-full grid-cols-[1fr_1fr]">
            <TabsTrigger value="consumables">Consumables</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {!!asset.alerts?.filter((a) => !a.resolved).length && (
                <span className="ml-2 bg-urgent text-xs text-urgent-foreground rounded-full flex items-center justify-center size-5">
                  {asset.alerts?.filter((a) => !a.resolved).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="consumables">
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
                      productCategoryId={asset.product.productCategoryId}
                    />
                  )}
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductRequests
                  productRequests={asset.productRequests ?? []}
                />
              </CardContent>
            </Card>
            <BasicCard
              title="Consumables"
              className="rounded-t-none"
              icon={SquareStack}
            >
              <ConsumablesTable
                consumables={asset.consumables ?? []}
                asset={asset}
              />
            </BasicCard>
          </TabsContent>
          <TabsContent value="alerts">
            <BasicCard title="Alert History" icon={ShieldAlert}>
              <AlertsTable alerts={asset.alerts ?? []} />
            </BasicCard>
          </TabsContent>
        </Tabs>
      </div>
      {canReadInspections && (
        <Card id="inspections">
          <CardHeader>
            <CardTitle>
              <SearchCheck /> Inspection History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssetInspections
              asset={asset}
              inspections={asset.inspections ?? []}
            />
          </CardContent>
        </Card>
      )}
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

function StatusCard({ asset }: { asset: Asset }) {
  return (
    <BasicCard title="Status" icon={Thermometer}>
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Inspection Status</span>
          </div>
          <InspectionStatusBadge
            status={
              asset.inspections &&
              getAssetInspectionStatus(
                asset.inspections,
                asset.inspectionCycle ?? asset.client?.defaultInspectionCycle
              )
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Alerts</span>
          </div>
          <AlertsStatusBadge
            status={getAssetAlertsStatus(asset.alerts ?? [])}
          />
        </div>
      </div>
    </BasicCard>
  );
}

function ConsumablesTable({
  consumables,
  asset,
}: {
  consumables: Consumable[];
  asset: Asset;
}) {
  const { user } = useAuth();
  const canCreate = can(user, "create", "consumables");
  const canUpdate = can(user, "update", "consumables");
  const canDelete = can(user, "delete", "consumables");

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
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "expiresOn",
        id: "expires",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value && isValid(parseISO(value)) ? (
            <span title={format(value, "PPpp")}>
              {formatDistanceToNow(value, {
                addSuffix: true,
                includeSeconds: true,
              })}
            </span>
          ) : (
            <>&mdash;</>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "product.ansiCategory.name",
        id: "ansiCategory",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="ANSI" />
        ),
        cell: ({ row }) =>
          row.original.product.ansiCategory ? (
            <AnsiCategoryDisplay
              ansiCategory={row.original.product.ansiCategory}
            />
          ) : (
            <>&mdash;</>
          ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const consumable = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!canUpdate}
                  onSelect={() => editConsumable.openData(consumable)}
                >
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!canDelete}
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Subproduct";
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
                    })
                  }
                >
                  <Trash />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [setDeleteAction, submitDelete, editConsumable, canUpdate, canDelete]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={consumables}
        initialState={{
          columnVisibility: {
            actions: canUpdate || canDelete,
          },
        }}
        searchPlaceholder="Search consumables..."
        actions={
          canCreate
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
          trigger={<></>}
        />
      )}
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}

function AlertsTable({ alerts }: { alerts: Alert[] }) {
  const columns = useMemo<ColumnDef<Alert>[]>(
    () => [
      {
        accessorKey: "createdOn",
        id: "date",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span title={format(value, "PPpp")}>
              {formatDistanceToNow(value, {
                addSuffix: true,
                includeSeconds: true,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "alertLevel",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "resolved",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as boolean;
          return value ? (
            <Check className="text-green-500 size-5" />
          ) : (
            <X className="text-red-500 size-5" />
          );
        },
      },
      {
        id: "view",
        cell: ({ row }) => (
          <AssetInspectionAlert
            assetId={row.original.assetId}
            alertId={row.original.id}
            trigger={
              <Button variant="secondary" size="sm">
                <CornerDownRight />
                Details
              </Button>
            }
          />
        ),
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={alerts.sort(dateSort("createdOn"))}
        searchPlaceholder="Search alerts..."
      />
    </>
  );
}
