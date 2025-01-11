import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect, type UIMatch } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
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
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.name || "Details",
  }),
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Product Category ID", { status: 400 });
  }

  const searchParams =
    URL.parse(request.url)?.searchParams ?? new URLSearchParams();

  // Handle asset questions actions.
  const action = searchParams.get("action");
  if (action === "add-asset-question") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof createAssetQuestionSchema>
    >(request, createAssetQuestionSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    const { init } = await api.productCategories.addQuestion(request, id, data);
    return redirect(`/products/categories/${id}`, init ?? undefined);
  } else if (action === "update-asset-question") {
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      throw new Response("questionId in query params is required", {
        status: 400,
      });
    }

    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateAssetQuestionSchema>
    >(request, updateAssetQuestionSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    const { init } = await api.productCategories.updateQuestion(
      request,
      id,
      questionId,
      data
    );
    return redirect(`/products/categories/${id}`, init ?? undefined);
  } else if (action === "delete-asset-question") {
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      throw new Response("questionId in query params is required", {
        status: 400,
      });
    }

    const { init } = await api.products.deleteQuestion(request, id, questionId);
    return redirect(`/products/categories/${id}`, init ?? undefined);
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateProductCategorySchema>
    >(request, updateProductCategorySchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return api.productCategories.update(request, id, data);
  } else if (request.method === "DELETE") {
    const { init } = await api.productCategories.delete(request, id);
    return redirect("/products/categories", init ?? undefined);
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Product Category ID", { status: 400 });
  }

  return api.productCategories.get(request, id);
};

export default function ProductCategoryDetails({
  loaderData: productCategory,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Product Category Details</CardTitle>
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
