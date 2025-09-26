import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { FireExtinguisher, MoreHorizontal, Pencil, SquareStack, Trash } from "lucide-react";
import { useNavigate, type ShouldRevalidateFunctionArgs, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import { buildImageProxyUrl } from "~/.server/images";
import { requireUserSession } from "~/.server/user-sesssion";
import ActiveIndicator from "~/components/active-indicator";
import ActiveIndicator2 from "~/components/active-indicator-2";
import ConfirmationDialog from "~/components/confirmation-dialog";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { AnsiCategoryDisplay } from "~/components/products/ansi-category-combobox";
import CustomTag from "~/components/products/custom-tag";
import EditProductButton from "~/components/products/edit-product-button";
import { ManufacturerCard } from "~/components/products/manufacturer-selector";
import { ProductImage } from "~/components/products/product-card";
import { ProductCategoryCard } from "~/components/products/product-category-selector";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Product } from "~/lib/models";
import { can, isGlobalAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

// When deleting a product, we don't want to revalidate the page. This would
// cause a 404 before the page could navigate back.
export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  if (arg.formMethod === "DELETE") {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.product.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);
  const userIsGlobalAdmin = isGlobalAdmin(user);

  const id = validateParam(params, "id");

  return api.products
    .get(request, id, { context: userIsGlobalAdmin ? "admin" : "user" })
    .then((product) => {
      return {
        product,
        optimizedImageUrl:
          product.imageUrl && buildImageProxyUrl(product.imageUrl, ["rs:fit:160:160:1:1"]),
      };
    });
};

export default function ProductDetails({
  loaderData: { product, optimizedImageUrl },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const globalAdmin = isGlobalAdmin(user);

  const hasOwnership = globalAdmin || product.client?.externalId === user.clientId;
  const canUpdate = can(user, "update", "products") && hasOwnership;
  const canDelete = can(user, "delete", "products") && hasOwnership;
  const navigate = useNavigate();

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const { submitJson: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete product",
    onSubmitted: () => {
      navigate(`../`);
    },
  });

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>
            <FireExtinguisher />
            <div className="inline-flex items-center gap-4">
              Product Details
              <div className="flex gap-2">
                {canUpdate && (
                  <EditProductButton
                    product={product}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                    canAssignOwnership={globalAdmin}
                    viewContext={globalAdmin ? "admin" : "user"}
                  />
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="icon"
                    type="button"
                    onClick={() => {
                      setDeleteAction((draft) => {
                        draft.open = true;
                        draft.title = "Delete Product";
                        draft.message = `Are you sure you want to delete ${product.name}?`;
                        draft.requiredUserInput = product.name;
                        draft.onConfirm = () => {
                          submitDelete(
                            {},
                            {
                              method: "delete",
                              path: `/api/proxy/products/${product.id}`,
                              viewContext: globalAdmin ? "admin" : "user",
                            }
                          );
                        };
                      });
                    }}
                  >
                    <Trash />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1"></div>
            <ActiveIndicator active={product.active} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
          <div className="grid gap-4">
            <Label>Properties</Label>
            <DataList
              details={[
                {
                  label: "Name",
                  value: product.name,
                },
                {
                  label: "Description",
                  value: product.description,
                },
                {
                  label: "Type",
                  value: <span className="capitalize">{product.type.toLowerCase()}</span>,
                },
                {
                  label: "SKU",
                  value: product.sku,
                },
                {
                  label: "Product URL",
                  value: product.productUrl,
                },
                {
                  label: "Owner",
                  value: product.client ? <CustomTag text={product.client.name} /> : <>&mdash;</>,
                },
                {
                  label: "Metadata",
                  value:
                    product.metadata && Object.keys(product.metadata).length > 0 ? (
                      <div className="flex flex-col flex-wrap gap-2">
                        {Object.entries(product.metadata ?? {}).map(([key, value]) => (
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
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
          <div className="grid gap-4">
            <Label>Image</Label>
            <ProductImage
              name={product.name}
              imageUrl={optimizedImageUrl ?? product.imageUrl}
              className="w-full rounded-lg border"
            />
          </div>
          <div className="grid gap-4">
            <Label>Category</Label>
            <ProductCategoryCard productCategory={product.productCategory} />
          </div>
          <div className="grid gap-4">
            <Label>Manufacturer</Label>
            <ManufacturerCard manufacturer={product.manufacturer} />
          </div>
          <div className="grid gap-4">
            <Label>Other</Label>
            <DataList
              details={[
                {
                  label: "Created",
                  value: format(product.createdOn, "PPpp"),
                },
                {
                  label: "Last Updated",
                  value: format(product.modifiedOn, "PPpp"),
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
        </CardContent>
      </Card>
      <div className="grid h-max grid-cols-1 gap-2 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <SquareStack /> Supplies
            </CardTitle>
            <CardDescription>
              These are generally considered consumables that belong to this product and should be
              replaced at regular intervals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuppliesTable supplies={product.consumableProducts ?? []} parentProduct={product} />
          </CardContent>
        </Card>
        {/* TODO: Once we're sure this is no longer needed, remove this card.
          - Generic supplies were intended for use in the First Aid category, but that
            has been done away with in favor of supplies specific to each first aid kit.
        */}
        {/* <Card>
          <CardHeader className="flex flex-row items-start gap-4">
            <div>
              <CardTitle>
                <SquareStack />
                <span>
                  {product.productCategory.shortName ??
                    product.productCategory.name}{" "}
                  Generic Supplies
                </span>
              </CardTitle>
              <CardDescription>
                These are supplies that belong to an entire category rather than
                a specific product.
              </CardDescription>
            </div>
            <div className="flex-1"></div>
            {getCanUpdateCategory(product.productCategory) && (
              <Button variant="link" asChild>
                <Link to={`/products/categories/${product.productCategory.id}`}>
                  Manage Category
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <SuppliesTable
              readOnly
              supplies={
                product.productCategory.products?.map((p) => ({
                  ...p,
                  productCategory: product.productCategory,
                })) ?? []
              }
            />
          </CardContent>
        </Card> */}
      </div>

      <ConfirmationDialog {...deleteAction} />
    </div>
  );
}

function SuppliesTable({
  supplies,
  parentProduct,
  readOnly = false,
}: {
  supplies: Product[];
  parentProduct?: Product;
  readOnly?: boolean;
}) {
  const { user } = useAuth();
  const globalAdmin = isGlobalAdmin(user);
  const canCreate = can(user, "create", "products");
  const canUpdate = can(user, "update", "products");
  const canDelete = can(user, "delete", "products");

  const editSupply = useOpenData<Product>();

  const { submit: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete supply",
  });

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  return (
    <>
      <DataTable
        columns={[
          {
            accessorKey: "active",
            header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
            cell: ({ getValue }) => <ActiveIndicator2 active={getValue() as boolean} />,
          },
          {
            accessorKey: "name",
            header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
          },
          {
            accessorKey: "sku",
            id: "SKU",
            header: ({ column, table }) => (
              <DataTableColumnHeader column={column} table={table} title="SKU" />
            ),
            cell: ({ getValue }) => getValue() || <>&mdash;</>,
          },
          {
            accessorKey: "ansiCategory.name",
            id: "ansiCategory",
            header: ({ column, table }) => (
              <DataTableColumnHeader column={column} table={table} title="ANSI" />
            ),
            cell: ({ row }) =>
              row.original.ansiCategory ? (
                <AnsiCategoryDisplay ansiCategory={row.original.ansiCategory} />
              ) : (
                <>&mdash;</>
              ),
          },
          {
            id: "actions",
            cell: ({ row }) => {
              const supply = row.original;

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
                    <DropdownMenuItem
                      disabled={!canUpdate}
                      onSelect={() => editSupply.openData(supply)}
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
                          draft.title = "Delete Supply";
                          draft.message = `Are you sure you want to delete ${supply.name}?`;
                          draft.requiredUserInput = supply.name || supply.id;
                          draft.onConfirm = () => {
                            submitDelete(
                              {},
                              {
                                method: "delete",
                                action: `/api/proxy/products/${supply.id}`,
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
        ]}
        data={supplies ?? []}
        initialState={{
          columnVisibility: {
            ansiCategory: supplies.some((supply) => supply.ansiCategory),
            actions: !readOnly && (canUpdate || canDelete),
          },
        }}
        actions={
          !readOnly && canCreate
            ? [<EditProductButton key="add-supply" parentProduct={parentProduct} />]
            : undefined
        }
      />
      {editSupply.data && (
        <EditProductButton
          open={editSupply.open}
          onOpenChange={editSupply.setOpen}
          product={editSupply.data}
          parentProduct={parentProduct}
          trigger={null}
          viewContext={globalAdmin ? "admin" : "user"}
        />
      )}
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
