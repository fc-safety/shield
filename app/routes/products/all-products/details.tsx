import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import ProductDetailsForm from "~/components/products/product-details-form";
import {
  updateProductSchemaResolver,
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

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateProductSchema>
    >(request, updateProductSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return api.products.update(request, id, data);
  } else if (request.method === "DELETE") {
    await api.products.delete(request, id);
    return redirect("/products/all");
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
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>Empty</CardContent>
      </Card>
    </div>
  );
}
