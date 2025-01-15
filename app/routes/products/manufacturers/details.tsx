import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator from "~/components/active-indicator";
import ManufacturerDetailsForm from "~/components/products/manufacturer-details-form";
import ProductCard from "~/components/products/product-card";
import {
  updateManufacturerSchemaResolver,
  type updateManufacturerSchema,
} from "~/lib/schema";
import {
  buildTitleFromBreadcrumb,
  getValidatedFormDataOrThrow,
  validateParam,
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

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateManufacturerSchema>
    >(request, updateManufacturerSchemaResolver);

    return api.manufacturers.update(request, id, data);
  } else if (request.method === "DELETE") {
    return api.manufacturers.deleteAndRedirect(
      request,
      id,
      "/products/manufacturers"
    );
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  return api.manufacturers.get(request, id);
};

export default function ProductManufacturerDetails({
  loaderData: manufacturer,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Manufacturer Details
            <ActiveIndicator active={manufacturer.active} />
          </CardTitle>
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
