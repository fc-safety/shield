import type { ColumnDef } from "@tanstack/react-table";
import { FireExtinguisher, Pencil, ShieldQuestion, Trash, type LucideIcon } from "lucide-react";
import { useMemo, type PropsWithChildren } from "react";
import { toast } from "sonner";
import ResponsiveActions from "~/components/common/responsive-actions";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import Icon from "~/components/icons/icon";
import AssetQuestionsDataTable from "~/components/products/asset-questions-data-table";
import EditProductButton from "~/components/products/edit-product-button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import { useAccessIntent } from "~/contexts/requested-access-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { AssetQuestion, Product } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { can } from "~/lib/users";

export default function ClientDetailsTabsProductsQuestionsTag({
  clientId,
  products,
  productsTotalCount,
  questions,
  questionsTotalCount,
  readOnly = true,
}: {
  clientId?: string;
  products: Product[];
  productsTotalCount?: number;
  questions: AssetQuestion[];
  questionsTotalCount?: number;
  readOnly?: boolean;
}) {
  const accessIntent = useAccessIntent();
  return (
    <div className="flex flex-col gap-2">
      <BasicCard
        title="Products"
        icon={FireExtinguisher}
        description={
          accessIntent === "system"
            ? "Products that are custom created by/for this particular client."
            : "Your custom products."
        }
        count={productsTotalCount ?? products.length}
      >
        <ProductsTable products={products} clientId={clientId} readOnly={readOnly} />
      </BasicCard>
      <BasicCard
        title="Questions"
        icon={ShieldQuestion}
        description={
          accessIntent === "system"
            ? "Questions that are custom created by/for this particular client."
            : "Your custom questions."
        }
        count={questionsTotalCount ?? questions.length}
      >
        <QuestionsTable questions={questions} readOnly={readOnly} clientId={clientId} />
      </BasicCard>
    </div>
  );
}

const BasicCard = ({
  title,
  icon: Icon,
  description,
  count,
  children,
}: PropsWithChildren<{
  title: string;
  icon?: LucideIcon;
  description?: string;
  count?: number;
}>) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {Icon && <Icon />} {title} {count !== undefined && <Badge>{count}</Badge>}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

const ProductsTable = ({
  products,
  clientId,
  readOnly = true,
}: {
  products: Product[];
  clientId?: string;
  readOnly?: boolean;
}) => {
  const { user } = useAuth();

  const canCreate = !readOnly && can(user, CAPABILITIES.CONFIGURE_PRODUCTS);
  const canUpdate = !readOnly && can(user, CAPABILITIES.CONFIGURE_PRODUCTS);
  const canDelete = !readOnly && can(user, CAPABILITIES.CONFIGURE_PRODUCTS);

  const editProduct = useOpenData<Product>();
  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const { submitJson: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete product",
    onSubmitted: () => {
      toast.success("Product deleted successfully.");
    },
  });

  const deleteProduct = (productId: string) => {
    submitDelete(
      {},
      {
        method: "delete",
        path: `/api/proxy/products/${productId}`,
      }
    );
  };

  const columns = useMemo(
    (): ColumnDef<Product>[] => [
      {
        accessorKey: "name",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "sku",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="SKU" />
        ),
        cell: ({ getValue }) => getValue() || <>&mdash;</>,
      },
      {
        accessorKey: "productCategory.name",
        id: "category",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row }) => {
          const category = row.original.productCategory;
          return (
            <span className="flex items-center gap-2">
              {category?.icon && (
                <Icon iconId={category.icon} color={category.color} className="text-lg" />
              )}
              {category?.shortName ?? category?.name ?? <>&mdash;</>}
            </span>
          );
        },
      },
      {
        accessorKey: "manufacturer.name",
        id: "manufacturer",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const product = row.original;
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
                      disabled: !canUpdate,
                      onAction: () => editProduct.openData(product),
                    },
                  ],
                },
                {
                  key: "destructive-actions",
                  actions: [
                    {
                      key: "delete",
                      text: "Delete",
                      variant: "destructive",
                      Icon: Trash,
                      disabled: !canDelete,
                      onAction: () => {
                        setDeleteAction((draft) => {
                          draft.open = true;
                          draft.title = "Delete Product";
                          draft.message = `Are you sure you want to delete ${product.name}?`;
                          draft.requiredUserInput = product.name;
                          draft.onConfirm = () => deleteProduct(product.id);
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
    []
  );
  return (
    <div>
      <DataTable
        columns={columns}
        data={products}
        searchPlaceholder="Search products..."
        actions={canCreate ? [<EditProductButton key="add" clientId={clientId} />] : undefined}
      />
      {editProduct.data && (
        <EditProductButton
          trigger={null}
          open={editProduct.open}
          onOpenChange={editProduct.setOpen}
          product={editProduct.data}
          clientId={clientId}
        />
      )}
      <ConfirmationDialog {...deleteAction} />
    </div>
  );
};

const QuestionsTable = ({
  questions,
  clientId,
  readOnly = true,
}: {
  questions: AssetQuestion[];
  clientId?: string;
  readOnly?: boolean;
}) => {
  return <AssetQuestionsDataTable questions={questions} readOnly={readOnly} clientId={clientId} />;
};
