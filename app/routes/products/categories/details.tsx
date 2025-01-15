import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect, type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator from "~/components/active-indicator";
import AssetQuestionsTable from "~/components/products/asset-questions-table";
import ProductCategoryDetailsForm from "~/components/products/product-category-details-form";
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
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Category Details
            <ActiveIndicator active={productCategory.active} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductCategoryDetailsForm productCategory={productCategory} />
        </CardContent>
      </Card>
      <Card className="h-max">
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
  );
}
