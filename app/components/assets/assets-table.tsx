import { type ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, Pencil, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import ActiveIndicator2 from "~/components/active-indicator-2";
import { AlertsStatusBadge, InspectionStatusBadge } from "~/components/assets/asset-status-badge";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable, type DataTableProps } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import Icon from "~/components/icons/icon";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { AlertsStatus, AssetInspectionsStatus } from "~/lib/enums";
import { getAssetAlertsStatus, getAssetInspectionStatus } from "~/lib/model-utils";
import type { Asset, ProductCategory } from "~/lib/models";
import { can, hasMultiSiteVisibility } from "~/lib/users";
import { dedupById } from "~/lib/utils";
import { useViewContext } from "~/lib/view-context";
import ActiveToggle from "../active-toggle";
import ResponsiveActions from "../common/responsive-actions";
import { ResponsiveDialog } from "../responsive-dialog";
import AssetDetailsForm from "./asset-details-form";
import CreateAssetButton from "./create-asset-assistant/create-asset-button";
import EditableTagDisplay from "./editable-tag-display";

export default function AssetsTable({
  assets,
  clientId,
  toDetailsRoute,
  initialState,
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  onColumnOrderChange,
  onPaginationChange,
}: {
  assets: Asset[];
  clientId?: string;
  toDetailsRoute?: (asset: Asset) => string;
} & Pick<
  DataTableProps<Asset, any>,
  | "initialState"
  | "onSortingChange"
  | "onColumnFiltersChange"
  | "onColumnVisibilityChange"
  | "onColumnOrderChange"
  | "onPaginationChange"
>) {
  const { user } = useAuth();
  const viewContext = useViewContext();
  const canCreate = can(user, "create", "assets");
  const canDelete = can(user, "delete", "assets");
  const canEdit = can(user, "update", "assets");

  const [searchParams] = useSearchParams();

  const editAsset = useOpenData<Asset>();

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });
  const { submitJson: submitDelete } = useModalFetcher();

  const columnFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = initialState?.columnFilters ?? [];
    if (searchParams.has("inspectionStatus")) {
      filters.push({
        id: "inspectionStatus",
        value: searchParams.get("inspectionStatus") ?? "",
      });
    }
    if (searchParams.has("siteId")) {
      filters.push({
        id: "site",
        value: searchParams.get("siteId") ?? "",
      });
    }
    if (searchParams.has("productCategoryId")) {
      filters.push({
        id: "category",
        value: searchParams.get("productCategoryId") ?? "",
      });
    }
    return filters;
  }, [searchParams, initialState?.columnFilters]);

  const columns = useMemo(
    (): ColumnDef<Asset>[] => [
      {
        accessorKey: "active",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue, row }) => {
          const asset = row.original;
          const isActive = getValue() as boolean;
          return !canEdit ? (
            <ActiveIndicator2 active={isActive} />
          ) : (
            <ActiveToggle
              active={isActive}
              path={getResourcePath(asset)}
              viewContext={viewContext}
            />
          );
        },
      },
      {
        accessorKey: "name",
        cell: ({ row, getValue }) => {
          const nameValue =
            (getValue() as string) ||
            `${row.original.location} - ${
              row.original.product?.productCategory?.shortName ??
              row.original.product?.productCategory?.name
            }`;

          if (!toDetailsRoute) {
            return nameValue;
          }
          return (
            <Link to={toDetailsRoute(row.original)} className="hover:underline">
              {nameValue}
            </Link>
          );
        },
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorFn: (row) => row.tag?.serialNumber,
        id: "tag",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="Tag Serial No." />
        ),
        cell: ({ row }) => {
          return (
            <EditableTagDisplay
              asset={row.original}
              tag={row.original.tag}
              key={`asset-tag-${row.original.id}`}
              size="compact"
            />
          );
        },
      },
      {
        accessorFn: (row) => row.product?.productCategory?.name,
        id: "category",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row }) => {
          const category = row.original.product?.productCategory;
          return (
            <span className="flex items-center gap-2">
              {category?.icon && (
                <Icon iconId={category.icon} color={category.color} className="text-lg" />
              )}
              {category?.shortName ?? category?.name ?? <>&mdash;</>}
            </span>
          );
        },
        filterFn: (row, _, filterValue) => {
          // Access the ID from the original row data
          const id = row.original.product?.productCategoryId;
          // Filter based on the ID
          return Array.isArray(filterValue) ? filterValue.includes(id) : id === filterValue;
        },
      },
      {
        accessorKey: "product.manufacturer.name",
        id: "manufacturer",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "product.name",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "location",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "placement",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorFn: ({ site }) => site?.name,
        id: "site",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        filterFn: (row, _, filterValue) => {
          // Access the ID from the original row data
          const id = row.original.site?.id;
          // Filter based on the ID
          return Array.isArray(filterValue) ? filterValue.includes(id) : id === filterValue;
        },
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorFn: ({ alerts }) => getAssetAlertsStatus(alerts ?? []),
        id: "alertsStatus",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row, getValue }) => {
          const children = <AlertsStatusBadge status={getValue() as AlertsStatus} />;

          if (!toDetailsRoute) {
            return children;
          }
          return <Link to={`${toDetailsRoute(row.original)}?tab=alerts`}>{children}</Link>;
        },
      },
      {
        accessorFn: ({ inspections, inspectionCycle, client }) =>
          getAssetInspectionStatus(
            inspections ?? [],
            inspectionCycle ?? client?.defaultInspectionCycle
          ),
        id: "inspectionStatus",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row, getValue }) => {
          const children = <InspectionStatusBadge status={getValue() as AssetInspectionsStatus} />;

          if (!toDetailsRoute) {
            return children;
          }

          return <Link to={`${toDetailsRoute(row.original)}#inspections`}>{children}</Link>;
        },
        filterFn: (row, id, filterValue) => {
          const status = getAssetInspectionStatus(
            row.original.inspections ?? [],
            row.original.inspectionCycle ?? row.original.client?.defaultInspectionCycle
          );
          return Array.isArray(filterValue) ? filterValue.includes(status) : filterValue === status;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const asset = row.original;

          return (
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "details",
                      text: "Details",
                      Icon: CornerDownRight,
                      linkTo: toDetailsRoute ? toDetailsRoute(asset) : undefined,
                      hide: !toDetailsRoute,
                    },
                    {
                      key: "edit",
                      text: "Edit",
                      Icon: Pencil,
                      disabled: !canEdit,
                      onAction: () => editAsset.openData(asset),
                      hide: !!toDetailsRoute,
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
                      disabled: !canDelete,
                      onAction: () => {
                        setDeleteAction((draft) => {
                          draft.open = true;
                          draft.title = "Delete Asset";
                          draft.message = `Are you sure you want to delete ${asset.name || asset.id}?`;
                          draft.requiredUserInput = asset.name || asset.id;
                          draft.onConfirm = () => {
                            submitDelete(
                              {},
                              {
                                method: "delete",
                                path: `/api/proxy/assets/${asset.id}`,
                                viewContext,
                              }
                            );
                          };
                        });
                      },
                    },
                  ],
                },
              ]}
            />
          );
        },
      },
    ],
    [setDeleteAction, canEdit, submitDelete, canDelete]
  );

  const allCategories = dedupById(assets.map((asset) => asset.product?.productCategory));
  const allManufacturers = dedupById(assets.map((asset) => asset.product?.manufacturer));

  return (
    <>
      <DataTable
        columns={columns}
        data={assets}
        searchPlaceholder="Search assets..."
        initialState={{
          ...initialState,
          columnFilters,
          columnVisibility: {
            active: true,
            name: true,
            tag: true,
            category: true,
            manufacturer: true,
            product_name: false,
            location: true,
            placement: false,
            site: hasMultiSiteVisibility(user),
            ...initialState?.columnVisibility,
          },
        }}
        onSortingChange={onSortingChange}
        onColumnFiltersChange={onColumnFiltersChange}
        onColumnVisibilityChange={onColumnVisibilityChange}
        onColumnOrderChange={onColumnOrderChange}
        onPaginationChange={onPaginationChange}
        filters={({ table }) => [
          {
            column: table.getColumn("category"),
            options: allCategories.map((category) => ({
              label: getCategoryName(category),
              value: category.id,
            })),
            title: "Category",
          },
          {
            column: table.getColumn("manufacturer"),
            options: allManufacturers
              .map((m) => m.name)
              .map((name) => ({
                label: name,
                value: name,
              })),
            title: "Manufacturer",
          },
          {
            column: table.getColumn("inspectionStatus"),
            options: [
              {
                label: "Compliant",
                value: "COMPLIANT_DUE_LATER",
              },
              {
                label: "Due Soon",
                value: "COMPLIANT_DUE_SOON",
              },
              {
                label: "Non-Compliant",
                value: "NON_COMPLIANT_INSPECTED",
              },
              {
                label: "Never Inspected",
                value: "NON_COMPLIANT_NEVER_INSPECTED",
              },
            ] satisfies { label: string; value: AssetInspectionsStatus }[],
            title: "Inspection Status",
          },
          {
            column: table.getColumn("site"),
            options: Object.values(
              assets
                .map((asset) => asset.site)
                .filter((site): site is NonNullable<typeof site> => !!site)
                .reduce(
                  (acc, site) => {
                    acc[site.id] = {
                      label: site.name,
                      value: site.id,
                    };
                    return acc;
                  },
                  {} as Record<string, { label: string; value: string }>
                )
            ),
            title: "Site",
          },
        ]}
        actions={
          canCreate
            ? [<CreateAssetButton key="add" clientId={clientId} />]
            : []
        }
      />
      <ConfirmationDialog {...deleteAction} />
      {canEdit && editAsset.data && (
        <ResponsiveDialog
          title="Edit Asset"
          open={editAsset.open}
          onOpenChange={editAsset.setOpen}
          dialogClassName="sm:max-w-lg"
        >
          <AssetDetailsForm
            asset={editAsset.data}
            onSubmitted={() => editAsset.setOpen(false)}
            clientId={clientId}
          />
        </ResponsiveDialog>
      )}
    </>
  );
}

const getCategoryName = (category: ProductCategory | undefined | null) => {
  if (!category) return "";
  return category.shortName || category.name;
};

const getResourcePath = (asset?: Asset) => {
  return `/api/proxy/assets/${asset?.id ?? ""}`;
};
