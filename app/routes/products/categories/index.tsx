import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, MoreHorizontal, Shapes, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/sessions";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import Icon from "~/components/icons/icon";
import CustomTag from "~/components/products/custom-tag";
import EditProductCategoryButton from "~/components/products/edit-product-category-button";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import useDeleteAction from "~/hooks/use-delete-action";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { ProductCategory } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { isGlobalAdmin } from "~/lib/users";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUserSession(request);

  const showAllProducts = getSearchParam(request, "show-all");

  let onlyMyProductCategories = showAllProducts !== "true";
  if (!showAllProducts && isGlobalAdmin(user)) {
    onlyMyProductCategories = false;
  }

  const query = { limit: 10000 } as QueryParams;

  if (onlyMyProductCategories) {
    query.client = {
      externalId: user.clientId,
    };
  }

  return api.productCategories.list(request, query).mapTo((r) => ({
    productCategories: r.results,
    onlyMyProductCategories,
  }));
}

export default function ProductCategories({
  loaderData: { productCategories, onlyMyProductCategories },
}: Route.ComponentProps) {
  const { submit: submitDelete } = useModalSubmit({
    defaultErrorMessage: "Error: Failed to delete product category",
  });
  const navigate = useNavigate();

  const setOnlyMyProductCategories = (value: boolean) => {
    navigate(`?show-all=${!value}`);
  };

  const [deleteAction, setDeleteAction] = useDeleteAction();

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
        accessorKey: "client.name",
        id: "owner",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) =>
          getValue() ? <CustomTag text={getValue() as string} /> : <>&mdash;</>,
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
                        submitDelete(
                          {},
                          {
                            method: "delete",
                            action: `/api/proxy/product-categories/${category.id}`,
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
    [submitDelete, setDeleteAction]
  );
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Shapes /> Product Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={productCategories}
            searchPlaceholder="Search categories..."
            actions={[<EditProductCategoryButton key="add" />]}
            externalFilters={[
              <div
                key="onlyMyProductCategories"
                className="flex items-center space-x-2"
              >
                <Switch
                  id="onlyMyProductCategories"
                  checked={onlyMyProductCategories}
                  onCheckedChange={(checked) =>
                    setOnlyMyProductCategories(checked)
                  }
                />
                <Label htmlFor="onlyMyProductCategories">
                  Only My Categories
                </Label>
              </div>,
            ]}
          />
        </CardContent>
      </Card>
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
