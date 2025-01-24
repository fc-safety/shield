import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { Link, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/sessions";
import ActiveIndicator from "~/components/active-indicator";
import DataList from "~/components/data-list";
import AssetQuestionsTable from "~/components/products/asset-questions-table";
import CustomTag from "~/components/products/custom-tag";
import EditProductButton from "~/components/products/edit-product-button";
import { ManufacturerCard } from "~/components/products/manufacturer-selector";
import { ProductImage } from "~/components/products/product-card";
import { ProductCategoryCard } from "~/components/products/product-category-selector";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { isGlobalAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.product.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const { user } = await requireUserSession(request);

  return api.products.get(request, id).mapTo((product) => {
    return {
      product,
      isGlobalAdmin: isGlobalAdmin(user),
      userClientId: user.clientId,
      canEdit:
        isGlobalAdmin(user) || product.client?.externalId === user.clientId,
    };
  });
};

export default function ProductDetails({
  loaderData: { product, canEdit, isGlobalAdmin, userClientId },
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="inline-flex items-center gap-4">
              Product Details
              <div className="flex gap-2">
                {canEdit && (
                  <EditProductButton
                    product={product}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                    canAssignOwnership={isGlobalAdmin}
                  />
                )}
              </div>
            </div>
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
                  value: (
                    <span className="capitalize">
                      {product.type.toLowerCase()}
                    </span>
                  ),
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
                  value: product.client ? (
                    <CustomTag text={product.client.name} />
                  ) : (
                    <>&mdash;</>
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
              imageUrl={product.imageUrl}
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
      <div className="h-max grid grid-cols-1 gap-2 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQuestionsTable
              questions={product.assetQuestions ?? []}
              readOnly={!canEdit}
              parentType="product"
              parentId={product.id}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center gap-2">
              <span>
                {product.productCategory.shortName ??
                  product.productCategory.name}{" "}
                Category Questions
              </span>
              {(isGlobalAdmin ||
                product.productCategory.client?.externalId ===
                  userClientId) && (
                <Button variant="link" asChild>
                  <Link
                    to={`/products/categories/${product.productCategory.id}`}
                  >
                    Manage Category
                  </Link>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQuestionsTable
              questions={product.productCategory.assetQuestions ?? []}
              readOnly
              parentType="productCategory"
              parentId={product.productCategory.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
