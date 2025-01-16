import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { redirect, type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator from "~/components/active-indicator";
import DataList from "~/components/data-list";
import Icon from "~/components/icons/icon";
import AssetQuestionsTable from "~/components/products/asset-questions-table";
import EditProductCategoryButton from "~/components/products/edit-product-category-button";
import ProductCard from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  createAssetQuestionSchema,
  createAssetQuestionSchemaResolver,
  updateAssetQuestionSchema,
  updateAssetQuestionSchemaResolver,
  updateProductCategorySchemaResolver,
  type updateProductCategorySchema,
} from "~/lib/schema";
import {
  buildTitleFromBreadcrumb,
  getSearchParams,
  getValidatedFormDataOrThrow,
  validateParam,
  validateSearchParam,
} from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const id = validateParam(params, "id");

  const searchParams = getSearchParams(request);

  // Handle asset questions actions.
  const action = searchParams.get("action");
  if (action === "add-asset-question") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof createAssetQuestionSchema>
    >(request, createAssetQuestionSchemaResolver);

    const { init } = await api.productCategories.addQuestion(request, id, data);
    return redirect(`/products/categories/${id}`, init ?? undefined);
  } else if (action === "update-asset-question") {
    const questionId = validateSearchParam(request, "questionId");

    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateAssetQuestionSchema>
    >(request, updateAssetQuestionSchemaResolver);

    const { init } = await api.productCategories.updateQuestion(
      request,
      id,
      questionId,
      data
    );
    return redirect(`/products/categories/${id}`, init ?? undefined);
  } else if (action === "delete-asset-question") {
    const questionId = validateSearchParam(request, "questionId");

    const { init } = await api.products.deleteQuestion(request, id, questionId);
    return redirect(`/products/categories/${id}`, init ?? undefined);
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateProductCategorySchema>
    >(request, updateProductCategorySchemaResolver);

    return api.productCategories.update(request, id, data);
  } else if (request.method === "DELETE") {
    return api.productCategories.deleteAndRedirect(
      request,
      id,
      "/products/categories"
    );
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  return api.productCategories.get(request, id);
};

export default function ProductCategoryDetails({
  loaderData: productCategory,
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
                  <EditProductCategoryButton
                    productCategory={productCategory}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                  />
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
