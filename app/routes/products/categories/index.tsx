import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  CornerDownRight,
  Globe2,
  HardHat,
  MoreHorizontal,
  Pencil,
  Plus,
  Shapes,
  Trash,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/user-sesssion";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import Icon from "~/components/icons/icon";
import CustomTag from "~/components/products/custom-tag";
import EditAnsiCategoryButton from "~/components/products/edit-ansi-category-button";
import EditProductCategoryButton from "~/components/products/edit-product-category-button";
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
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import { type AnsiCategory, type ProductCategory } from "~/lib/models";
import { can, isGlobalAdmin } from "~/lib/users";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUserSession(request);
  const canReadAnsiCategories = can(user, "read", "ansi-categories");

  const [productCategories, ansiCategories] = await Promise.all([
    api.productCategories.list(request, { limit: 10000 }),
    canReadAnsiCategories
      ? api.ansiCategories.list(request, { limit: 10000 })
      : Promise.resolve(null),
  ]);

  return {
    productCategories: productCategories.results,
    ansiCategories: ansiCategories?.results ?? [],
  };
}

export default function ProductCategories({
  loaderData: { productCategories, ansiCategories },
}: Route.ComponentProps) {
  const { user } = useAuth();

  const userIsGlobalAdmin = isGlobalAdmin(user);
  const hasCreatePermission = can(user, "create", "product-categories");
  const hasDeletePermission = can(user, "delete", "product-categories");

  const canReadAnsiCategories = can(user, "read", "ansi-categories");

  // useCallback(
  //   (productCategory: ProductCategory) =>
  //     can(user, "delete", "product-categories") &&
  //     (isGlobalAdmin(user) ||
  //       productCategory.client?.externalId === user.clientId),
  //   [user]
  // )

  const [globalCategories, clientCategories, myCategories] = useMemo(() => {
    const globalCategories: ProductCategory[] = [];
    const clientCategories: ProductCategory[] = [];
    const myCategories: ProductCategory[] = [];

    productCategories.forEach((category) => {
      if (category.clientId !== null) {
        if (category.client?.externalId === user.clientId) {
          myCategories.push(category);
        } else {
          clientCategories.push(category);
        }
      } else {
        globalCategories.push(category);
      }
    });

    return [globalCategories, clientCategories, myCategories];
  }, [productCategories, user.clientId]);

  return (
    <div className="grid gap-4">
      <ProductCategoriesCard
        title="My Product Categories"
        description="These are product categories that either you or someone in your organization has created."
        TitleIcon={Shapes}
        productCategories={myCategories}
        canCreate={hasCreatePermission}
        canDelete={hasDeletePermission}
      />
      <ProductCategoriesCard
        title="Global Product Categories"
        description="These are product categories that anyone can use."
        TitleIcon={Globe2}
        productCategories={globalCategories}
        canCreate={hasCreatePermission && userIsGlobalAdmin}
        canDelete={hasDeletePermission && userIsGlobalAdmin}
      />
      {isGlobalAdmin(user) && (
        <ProductCategoriesCard
          title="Client Product Categories"
          description="These are product categories that have been created by other clients."
          TitleIcon={Building2}
          productCategories={clientCategories}
          canCreate={false}
          canDelete={userIsGlobalAdmin}
          showOwner
        />
      )}
      {canReadAnsiCategories && (
        <AnsiCategoriesCard ansiCategories={ansiCategories} />
      )}
    </div>
  );
}

function ProductCategoriesCard({
  productCategories,
  title,
  description,
  canCreate,
  canDelete,
  TitleIcon = Shapes,
  showOwner = false,
}: {
  productCategories: ProductCategory[];
  title: string;
  description?: string;
  canCreate: boolean;
  canDelete: boolean;
  TitleIcon?: LucideIcon;
  showOwner?: boolean;
}) {
  const { submit: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete product category",
  });

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
                  disabled={!canDelete}
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
      <Card>
        <CardHeader>
          <CardTitle>
            <TitleIcon /> {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={productCategories}
            initialState={{
              columnVisibility: {
                owner: showOwner,
              },
            }}
            searchPlaceholder="Search categories..."
            actions={
              canCreate ? [<EditProductCategoryButton key="add" />] : undefined
            }
          />
        </CardContent>
      </Card>
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}

function AnsiCategoriesCard({
  ansiCategories,
}: {
  ansiCategories: AnsiCategory[];
}) {
  const { user } = useAuth();

  const canCreate = useMemo(
    () => can(user, "create", "ansi-categories"),
    [user]
  );
  const canUpdate = useMemo(
    () => can(user, "update", "ansi-categories"),
    [user]
  );
  const canDelete = useMemo(
    () => can(user, "delete", "ansi-categories"),
    [user]
  );

  const editAnsiCategory = useOpenData<AnsiCategory>();

  const { submit: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete ANSI category",
  });
  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <HardHat /> ANSI Categories
          </CardTitle>
          <CardDescription>
            Special categories for organizing supplies (typically for First Aid)
            by ANSI standard.
          </CardDescription>
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
                id: "actions",
                cell: ({ row }) => (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => editAnsiCategory.openData(row.original)}
                      disabled={!canUpdate}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() =>
                        setDeleteAction((draft) => {
                          draft.open = true;
                          draft.title = "Delete ANSI Category";
                          draft.message = `Are you sure you want to delete ${row.original.name}?`;
                          draft.requiredUserInput = row.original.name;
                          draft.onConfirm = () => {
                            submitDelete(
                              {},
                              {
                                method: "delete",
                                action: `/api/proxy/ansi-categories/${row.original.id}`,
                              }
                            );
                          };
                        })
                      }
                      disabled={!canDelete}
                    >
                      <Trash />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={ansiCategories}
            initialState={{
              columnVisibility: {
                actions: canUpdate || canDelete,
              },
            }}
            actions={
              canCreate
                ? [
                    <Button
                      key="add"
                      size="sm"
                      onClick={() => editAnsiCategory.openNew()}
                    >
                      <Plus />
                      Add ANSI Category
                    </Button>,
                  ]
                : undefined
            }
          />
        </CardContent>
      </Card>
      <EditAnsiCategoryButton
        ansiCategory={editAnsiCategory.data ?? undefined}
        open={editAnsiCategory.open}
        onOpenChange={editAnsiCategory.setOpen}
        trigger={null}
      />
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
