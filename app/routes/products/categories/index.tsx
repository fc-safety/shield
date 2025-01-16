import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, MoreHorizontal, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useFetcher } from "react-router";
import { useImmer } from "use-immer";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import Icon from "~/components/icons/icon";
import EditProductCategoryButton from "~/components/products/edit-product-category-button";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { ProductCategory } from "~/lib/models";
import {
  createProductCategorySchemaResolver,
  type createProductCategorySchema,
} from "~/lib/schema";
import { getValidatedFormDataOrThrow } from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof createProductCategorySchema>
  >(request, createProductCategorySchemaResolver);

  return api.productCategories.create(request, data);
};

export function loader({ request }: Route.LoaderArgs) {
  return api.productCategories.list(request, { limit: 10000 });
}

export default function ProductCategories({
  loaderData: productCategories,
}: Route.ComponentProps) {
  const fetcher = useFetcher();

  const [deleteAction, setDeleteAction] = useImmer({
    open: false,
    action: () => {},
    cancel: () => {},
    title: "Are you sure?",
    message: "",
    requiredUserInput: "",
  });

  const columns: ColumnDef<ProductCategory>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => <ActiveIndicator2 active={!!getValue()} />,
      },
      {
        id: "icon",
        accessorFn: ({ icon }) => icon,
        enableSorting: false,
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="Icon" />
        ),
        cell: ({ row, getValue }) => {
          const icon = getValue() as string;
          return icon ? (
            <Icon
              iconId={icon}
              color={row.original.color}
              className="text-lg"
            />
          ) : (
            <>&mdash;</>
          );
        },
      },
      {
        accessorKey: "name",
        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="hover:underline">
            {getValue() as string}
          </Link>
        ),
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "shortName",
        id: "code",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "description",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),

        cell: ({ getValue }) => (
          <span className="line-clamp-2">
            {(getValue() as string) || <>&mdash;</>}
          </span>
        ),
      },
      {
        accessorKey: "_count.products",
        id: "products",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const category = row.original;

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
                  <Link to={category.id}>
                    <CornerDownRight />
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Product Category";
                      draft.message = `Are you sure you want to delete ${
                        category.name || category.id
                      }?`;
                      draft.requiredUserInput = category.name || category.id;
                      draft.action = () => {
                        fetcher.submit(
                          {},
                          {
                            method: "delete",
                            action: `/products/categories/${category.id}`,
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
    [fetcher, setDeleteAction]
  );
  return (
    <>
      <DataTable
        columns={columns}
        data={productCategories.results}
        searchPlaceholder="Search categories..."
        actions={[<EditProductCategoryButton key="add" />]}
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
