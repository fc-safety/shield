import { type ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, MoreHorizontal, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useFetcher, useSearchParams } from "react-router";
import { useImmer } from "use-immer";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import NewAssetButton from "~/components/assets/new-asset-button";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Asset, ProductCategory } from "~/lib/models";
import { createAssetSchema, createAssetSchemaResolver } from "~/lib/schema";
import { dedupById, getValidatedFormDataOrThrow } from "~/lib/utils";
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
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher();

  const [deleteAction, setDeleteAction] = useImmer({
    open: false,
    action: () => {},
    cancel: () => {},
    title: "Are you sure?",
    message: "",
    requiredUserInput: "",
  });

  const columnFilters = useMemo(() => {
    if (searchParams.has("status")) {
      return [
        {
          id: "status",
          value: searchParams.get("status"),
        },
      ];
    }
    return [];
  }, [searchParams]);

  const columns: ColumnDef<Asset>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column }) => <DataTableColumnHeader column={column} />,
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
      },
      {
        accessorKey: "tag.serialNumber",
        id: "tag",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tag" />
        ),
      },
      {
        accessorFn: (row) =>
          row.product?.productCategory?.shortName ??
          row.product?.productCategory?.name,
        id: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
      },
      {
        accessorKey: "location",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Location" />
        ),
      },
      {
        accessorKey: "placement",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Placement" />
        ),
      },
      {
        accessorKey: "product.manufacturer.name",
        id: "manufacturer",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Manufacturer" />
        ),
      },
      // {
      //   accessorKey: "status",
      //   header: ({ column }) => (
      //     <DataTableColumnHeader column={column} title="Status" />
      //   ),
      //   cell: ({ getValue }) => {
      //     const status = getValue();
      //     return status === "ok" ? (
      //       <ShieldCheck className="text-green-500" />
      //     ) : status === "warning" ? (
      //       <ShieldAlert className="text-yellow-500" />
      //     ) : (
      //       <ShieldClose className="text-red-500" />
      //     );
      //   },
      // },
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
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Asset";
                      draft.message = `Are you sure you want to delete ${
                        asset.name || asset.id
                      }?`;
                      draft.requiredUserInput = asset.name || asset.id;
                      draft.action = () => {
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
    [setDeleteAction, fetcher]
  );

  const allCategories = dedupById(
    assets.results.map((asset) => asset.product?.productCategory)
  );
  const allManufacturers = dedupById(
    assets.results.map((asset) => asset.product?.manufacturer)
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={assets.results}
        searchPlaceholder="Search assets..."
        initialState={{
          columnFilters,
        }}
        filters={({ table }) => [
          {
            column: table.getColumn("category"),
            options: allCategories.map(getCategoryName).map((categoryName) => ({
              label: categoryName,
              value: categoryName,
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
          //   {
          //     column: table.getColumn("status"),
          //     options: assetStatuses.map((type) => ({
          //       label: type,
          //       value: type,
          //       icon:
          //         type === "ok"
          //           ? CheckCircle2
          //           : type === "warning"
          //           ? TriangleAlert
          //           : XCircle,
          //     })),
          //     title: "Status",
          //   },
        ]}
        actions={[
          <NewAssetButton key="add" />,
          // TODO: If bulk actions are needed, make sure to add select column.
          //   <DropdownMenu key="bulk-actions">
          //     <DropdownMenuTrigger asChild>
          //       <Button
          //         variant="outline"
          //         size="sm"
          //         disabled={
          //           !table.getIsSomeRowsSelected() &&
          //           !table.getIsAllRowsSelected()
          //         }
          //       >
          //         Actions ({table.getSelectedRowModel().rows.length})
          //         <ChevronDown className="h-4 w-4" />
          //       </Button>
          //     </DropdownMenuTrigger>
          //     <DropdownMenuContent align="end">
          //       <DropdownMenuItem>
          //         <Trash />
          //         Some Bulk Action
          //       </DropdownMenuItem>
          //     </DropdownMenuContent>
          //   </DropdownMenu>,
        ]}
      />
      <ConfirmationDialog
        open={deleteAction.open}
        onOpenChange={(open) =>
          setDeleteAction((draft) => {
            draft.open = open;
          })
        }
        destructive
        onConfirm={() => deleteAction.action()}
        confirmText="Delete"
        onCancel={() => deleteAction.cancel()}
        requiredUserInput={deleteAction.requiredUserInput}
        title={deleteAction.title}
        message={deleteAction.message}
      />
    </>
  );
}

const getCategoryName = (category: ProductCategory | undefined | null) => {
  if (!category) return "";
  return category.shortName || category.name;
};
