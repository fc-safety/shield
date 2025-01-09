import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import ProductCategoryDetailsForm from "~/components/products/product-category-details-form";
import {
  updateProductCategorySchemaResolver,
  type updateProductCategorySchema,
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
    throw new Response("No Product Category ID", { status: 400 });
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
    await api.productCategories.delete(request, id);
    return redirect("/products/categories");
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
        <CardContent>Empty</CardContent>
      </Card>
    </div>
  );
}
