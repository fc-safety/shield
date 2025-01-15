import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, redirect, type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator from "~/components/active-indicator";
import AssetQuestionsTable from "~/components/products/asset-questions-table";
import ProductDetailsForm from "~/components/products/product-details-form";
import { Button } from "~/components/ui/button";
import {
  createAssetQuestionSchemaResolver,
  updateAssetQuestionSchemaResolver,
  updateProductSchemaResolver,
  type createAssetQuestionSchema,
  type updateAssetQuestionSchema,
  type updateProductSchema,
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

  const action = searchParams.get("action");
  if (action === "add-asset-question") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof createAssetQuestionSchema>
    >(request, createAssetQuestionSchemaResolver);

    const { init } = await api.products.addQuestion(request, id, data);
    return redirect(`/products/all/${id}`, init ?? undefined);
  } else if (action === "update-asset-question") {
    const questionId = validateSearchParam(request, "questionId");

    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateAssetQuestionSchema>
    >(request, updateAssetQuestionSchemaResolver);

    const { init } = await api.products.updateQuestion(
      request,
      id,
      questionId,
      data
    );
    return redirect(`/products/all/${id}`, init ?? undefined);
  } else if (action === "delete-asset-question") {
    const questionId = validateSearchParam(request, "questionId");

    const { init } = await api.products.deleteQuestion(request, id, questionId);
    return redirect(`/products/all/${id}`, init ?? undefined);
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateProductSchema>
    >(request, updateProductSchemaResolver);

    return api.products.update(request, id, data);
  } else if (request.method === "DELETE") {
    return api.products.deleteAndRedirect(request, id, "/products/all");
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  return api.products.get(request, id);
};

export default function ProductDetails({
  loaderData: product,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Details
            <ActiveIndicator active={product.active} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductDetailsForm product={product} />
        </CardContent>
      </Card>
      <div className="h-max grid grid-cols-1 gap-2 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQuestionsTable questions={product.assetQuestions ?? []} />
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
              <Button variant="link" asChild>
                <Link to={`/products/categories/${product.productCategory.id}`}>
                  Manage Category
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQuestionsTable
              questions={product.productCategory.assetQuestions ?? []}
              readOnly
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
