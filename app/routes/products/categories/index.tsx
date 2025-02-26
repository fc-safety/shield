import type { ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRight,
  HardHat,
  MoreHorizontal,
  Pencil,
  Shapes,
  Trash,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/sessions";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import Icon from "~/components/icons/icon";
import CustomTag from "~/components/products/custom-tag";
import EditAnsiCategoryButton from "~/components/products/edit-ansi-category-button";
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
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import { useOpenData } from "~/hooks/use-open-data";
import type { AnsiCategory, ProductCategory } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { can, isGlobalAdmin } from "~/lib/users";
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

  return api.productCategories
    .list(request, query)
    .mergeWith(api.ansiCategories.list(request, { limit: 10000 }))
    .mapTo(([productCategoryResults, ansiCategoryResults]) => ({
      productCategories: productCategoryResults.results,
      ansiCategories: ansiCategoryResults.results,
      onlyMyProductCategories,
    }));
}

export default function ProductCategories({
  loaderData: { productCategories, ansiCategories, onlyMyProductCategories },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canCreate = can(user, "create", "product-categories");
  const canDelete = useCallback(
    (productCategory: ProductCategory) =>
      can(user, "delete", "product-categories") &&
      (isGlobalAdmin(user) ||
        productCategory.client?.externalId === user.clientId),
    [user]
  );

  const { submit: submitDelete } = useModalSubmit({
    defaultErrorMessage: "Error: Failed to delete product category",
  });
  const navigate = useNavigate();

  const setOnlyMyProductCategories = (value: boolean) => {
    navigate(`?show-all=${!value}`);
  };

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
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
                  disabled={!canDelete(category)}
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Product Category";
                      draft.message = `Are you sure you want to delete ${
                        category.name || category.id
                      }?`;
                      draft.requiredUserInput = category.name || category.id;
                      draft.onConfirm = () => {
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
    [submitDelete, setDeleteAction, canDelete]
  );
  return (
    <>
      <div className="grid gap-4">
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
              actions={
                canCreate
                  ? [<EditProductCategoryButton key="add" />]
                  : undefined
              }
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
        <AnsiCategoriesCard ansiCategories={ansiCategories} />
      </div>
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}

function AnsiCategoriesCard({
  ansiCategories,
}: {
  ansiCategories: AnsiCategory[];
}) {
  const editAnsiCategory = useOpenData<AnsiCategory>();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <HardHat /> ANSI Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "icon",
                accessorFn: ({ icon }) => icon,
                enableSorting: false,
                header: ({ column, table }) => (
                  <DataTableColumnHeader
                    column={column}
                    table={table}
                    title="Icon"
                  />
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
                    <div
                      className="size-5 rounded-sm"
                      style={{ backgroundColor: row.original.color ?? "gray" }}
                    />
                  );
                },
              },
              {
                accessorKey: "name",
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
                id: "edit",
                cell: ({ row }) => (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => editAnsiCategory.openData(row.original)}
                  >
                    <Pencil />
                    Edit
                  </Button>
                ),
              },
            ]}
            data={ansiCategories}
          />
        </CardContent>
      </Card>
      <EditAnsiCategoryButton
        ansiCategory={editAnsiCategory.data ?? undefined}
        open={editAnsiCategory.open}
        onOpenChange={editAnsiCategory.setOpen}
        trigger={<></>}
      />
    </>
  );
}
