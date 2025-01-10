import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, redirect } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import AssetQuestionsTable from "~/components/products/asset-questions-table";
import ProductDetailsForm from "~/components/products/product-details-form";
import { Button } from "~/components/ui/button";
import {
  createAssetQuestionSchemaResolver,
  updateProductSchemaResolver,
  type createAssetQuestionSchema,
  type updateProductSchema,
} from "~/lib/schema";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs) => ({
    label: data.name || "Details",
  }),
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Product ID", { status: 400 });
  }

  const action = URL.parse(request.url)?.searchParams.get("action");
  if (action === "add-asset-question") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof createAssetQuestionSchema>
    >(request, createAssetQuestionSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    const { init } = await api.products.addQuestion(request, id, data);
    return redirect(`/products/all/${id}`, init ?? undefined);
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateProductSchema>
    >(request, updateProductSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return api.products.update(request, id, data);
  } else if (request.method === "DELETE") {
    const { init } = await api.products.delete(request, id);
    return redirect("/products/all", init ?? undefined);
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Product ID", { status: 400 });
  }

  return api.products.get(request, id);
};

export default function ProductDetails({
  loaderData: product,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
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
