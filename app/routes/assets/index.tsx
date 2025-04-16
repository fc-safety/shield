import { type ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, MoreHorizontal, Shield, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useFetcher, useSearchParams } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import {
  AlertsStatusBadge,
  InspectionStatusBadge,
} from "~/components/assets/asset-status-badge";
import EditAssetButton from "~/components/assets/edit-asset-button";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { CopyableText } from "~/components/copyable-text";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import Icon from "~/components/icons/icon";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import type { AlertsStatus, AssetInspectionsStatus } from "~/lib/enums";
import { getValidatedFormDataOrThrow } from "~/lib/forms";
import {
  getAssetAlertsStatus,
  getAssetInspectionStatus,
} from "~/lib/model-utils";
import type { Asset, ProductCategory } from "~/lib/models";
import { createAssetSchema, createAssetSchemaResolver } from "~/lib/schema";
import { can, hasMultiSiteVisibility } from "~/lib/users";
import { dedupById } from "~/lib/utils";
import type { Route } from "./+types/index";

export const loader = ({ request }: Route.LoaderArgs) => {
  return api.assets.list(request, { limit: 10000 });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof createAssetSchema>
  >(request, createAssetSchemaResolver);

  return api.assets.create(request, data);
};

export default function AssetsIndex({
  loaderData: assets,
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canCreate = can(user, "create", "assets");
  const canDelete = can(user, "delete", "assets");

  const [searchParams] = useSearchParams();
  const fetcher = useFetcher();

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const columnFilters = useMemo(() => {
    const filters: { id: string; value: string }[] = [];
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
  }, [searchParams]);

  const columns = useMemo(
    (): ColumnDef<Asset>[] => [
      {
        accessorKey: "active",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => <ActiveIndicator2 active={!!getValue()} />,
      },
      {
        accessorKey: "name",
        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="hover:underline">
            {(getValue() as string) ??
              `${row.original.location} - ${
                row.original.product?.productCategory?.shortName ??
                row.original.product?.productCategory?.name
              }`}
          </Link>
        ),
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "tag.serialNumber",
        id: "tag",
        header: ({ column, table }) => (
          <DataTableColumnHeader
            column={column}
            table={table}
            title="Tag Serial No."
          />
        ),
        cell: ({ getValue }) => {
          const text = getValue() as string;
          return text ? (
            <CopyableText text={getValue() as string} hoverOnly />
          ) : (
            <>&mdash;</>
          );
        },
      },
      {
        accessorFn: (row) => row.product?.productCategory?.name,
        id: "category",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row }) => {
          const category = row.original.product?.productCategory;
          return (
            <span className="flex items-center gap-2">
              {category?.icon && (
                <Icon
                  iconId={category.icon}
                  color={category.color}
                  className="text-lg"
                />
              )}
              {category?.shortName ?? category?.name ?? <>&mdash;</>}
            </span>
          );
        },
        filterFn: (row, _, filterValue) => {
          // Access the ID from the original row data
          const id = row.original.product?.productCategoryId;
          // Filter based on the ID
          return Array.isArray(filterValue)
            ? filterValue.includes(id)
            : id === filterValue;
        },
      },
      {
        accessorKey: "product.manufacturer.name",
        id: "manufacturer",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "product.name",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "location",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "placement",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "site.name",
        id: "site",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row }) => {
          const site = row.original.site;
          return site ? site.name : <>&mdash;</>;
        },
        filterFn: (row, _, filterValue) => {
          // Access the ID from the original row data
          const id = row.original.site?.id;
          // Filter based on the ID
          return Array.isArray(filterValue)
            ? filterValue.includes(id)
            : id === filterValue;
        },
      },
      {
        accessorFn: ({ alerts }) => getAssetAlertsStatus(alerts ?? []),
        id: "alertsStatus",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row, getValue }) => (
          <Link to={`${row.original.id}?tab=alerts`}>
            <AlertsStatusBadge status={getValue() as AlertsStatus} />
          </Link>
        ),
      },
      {
        accessorFn: ({ inspections, inspectionCycle, client }) =>
          getAssetInspectionStatus(
            inspections ?? [],
            inspectionCycle ?? client?.defaultInspectionCycle
          ),
        id: "inspectionStatus",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row, getValue }) => (
          <Link to={`${row.original.id}#inspections`}>
            <InspectionStatusBadge
              status={getValue() as AssetInspectionsStatus}
            />
          </Link>
        ),
        filterFn: (row, id, filterValue) => {
          const status = getAssetInspectionStatus(
            row.original.inspections ?? [],
            row.original.inspectionCycle ??
              row.original.client?.defaultInspectionCycle
          );
          return Array.isArray(filterValue)
            ? filterValue.includes(status)
            : filterValue === status;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const asset = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                <DropdownMenuItem asChild>
                  <Link to={`/assets/${asset.id}`}>
                    <CornerDownRight />
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!canDelete}
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Asset";
                      draft.message = `Are you sure you want to delete ${
                        asset.name || asset.id
                      }?`;
                      draft.requiredUserInput = asset.name || asset.id;
                      draft.onConfirm = () => {
                        fetcher.submit(
                          {},
                          {
                            method: "delete",
                            action: `/assets/${asset.id}`,
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
    [setDeleteAction, fetcher, canDelete]
  );

  const allCategories = dedupById(
    assets.results.map((asset) => asset.product?.productCategory)
  );
  const allManufacturers = dedupById(
    assets.results.map((asset) => asset.product?.manufacturer)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Shield /> Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={assets.results}
            searchPlaceholder="Search assets..."
            initialState={{
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
              },
            }}
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
                    value: "COMPLIANT",
                  },
                  {
                    label: "Due Soon",
                    value: "DUE_SOON",
                  },
                  {
                    label: "Non-Compliant",
                    value: "NON_COMPLIANT",
                  },
                  {
                    label: "Never Inspected",
                    value: "NEVER",
                  },
                ] satisfies { label: string; value: AssetInspectionsStatus }[],
                title: "Inspection Status",
              },
              {
                column: table.getColumn("site"),
                options: Object.values(
                  assets.results
                    .map((asset) => asset.site)
                    .filter((site): site is NonNullable<typeof site> => !!site)
                    .reduce((acc, site) => {
                      acc[site.id] = {
                        label: site.name,
                        value: site.id,
                      };
                      return acc;
                    }, {} as Record<string, { label: string; value: string }>)
                ),
                title: "Site",
              },
            ]}
            actions={canCreate ? [<EditAssetButton key="add" />] : []}
          />
        </CardContent>
      </Card>
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}

const getCategoryName = (category: ProductCategory | undefined | null) => {
  if (!category) return "";
  return category.shortName || category.name;
};
