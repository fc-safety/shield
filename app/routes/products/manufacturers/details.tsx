import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import ManufacturerDetailsForm from "~/components/products/manufacturer-details-form";
import ProductCard from "~/components/products/product-card";
import {
  updateManufacturerSchemaResolver,
  type updateManufacturerSchema,
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
    throw new Response("No Manufacturer ID", { status: 400 });
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateManufacturerSchema>
    >(request, updateManufacturerSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return api.manufacturers.update(request, id, data);
  } else if (request.method === "DELETE") {
    await api.manufacturers.delete(request, id);
    return redirect("/products/manufacturers");
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Manufacturer ID", { status: 400 });
  }

  return api.manufacturers.get(request, id);
};

export default function ProductManufacturerDetails({
  loaderData: manufacturer,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Manufacturer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ManufacturerDetailsForm manufacturer={manufacturer} />
        </CardContent>
      </Card>
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {manufacturer?.products?.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  manufacturerId: manufacturer.id,
                  manufacturer: manufacturer,
                }}
                navigateTo={`/products/all/${product.id}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
