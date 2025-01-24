import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { type UIMatch } from "react-router";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/sessions";
import ActiveIndicator from "~/components/active-indicator";
import DataList from "~/components/data-list";
import Icon from "~/components/icons/icon";
import AssetQuestionsTable from "~/components/products/asset-questions-table";
import CustomTag from "~/components/products/custom-tag";
import EditProductCategoryButton from "~/components/products/edit-product-category-button";
import ProductCard from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { isGlobalAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.productCategory.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const { user } = await requireUserSession(request);

  return api.productCategories.get(request, id).mapTo((productCategory) => {
    return {
      productCategory,
      canEdit:
        isGlobalAdmin(user) ||
        productCategory.client?.externalId === user.clientId,
    };
  });
};

export default function ProductCategoryDetails({
  loaderData: { productCategory, canEdit },
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="inline-flex items-center gap-4">
                Product Category Details
                <div className="flex gap-2">
                  {canEdit && (
                    <EditProductCategoryButton
                      productCategory={productCategory}
                      trigger={
                        <Button variant="secondary" size="icon" type="button">
                          <Pencil />
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
              <ActiveIndicator active={productCategory.active} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="grid gap-4">
              <Label>Properties</Label>
              <DataList
                details={[
                  {
                    label: "Name",
                    value: productCategory.name,
                  },
                  {
                    label: "Code",
                    value: productCategory.shortName,
                  },
                  {
                    label: "Description",
                    value: productCategory.description,
                  },
                  {
                    label: "Icon",
                    value: productCategory.icon && (
                      <Icon
                        iconId={productCategory.icon}
                        color={productCategory.color}
                      />
                    ),
                  },
                  {
                    label: "Owner",
                    value: productCategory.client ? (
                      <CustomTag text={productCategory.client.name} />
                    ) : (
                      <>&mdash;</>
                    ),
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
            <div className="grid gap-4">
              <Label>Other</Label>
              <DataList
                details={[
                  {
                    label: "Created",
                    value: format(productCategory.createdOn, "PPpp"),
                  },
                  {
                    label: "Last Updated",
                    value: format(productCategory.modifiedOn, "PPpp"),
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQuestionsTable
              questions={productCategory.assetQuestions ?? []}
              readOnly={!canEdit}
              parentType="productCategory"
              parentId={productCategory.id}
            />
          </CardContent>
        </Card>
      </div>
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fit,_minmax(28rem,_1fr))] gap-4">
            {productCategory?.products?.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  productCategoryId: productCategory.id,
                  productCategory: productCategory,
                }}
                navigateTo={`/products/all/${product.id}`}
                displayCategory={false}
              />
            ))}
            {!productCategory?.products?.length && (
              <span className="text-sm text-muted-foreground col-span-full text-center">
                No products found.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
