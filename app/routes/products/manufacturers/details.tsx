import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import ActiveIndicator from "~/components/active-indicator";
import DataList from "~/components/data-list";
import LinkPreview from "~/components/link-preview";
import EditManufacturerButton from "~/components/products/edit-manufacturer-button";
import ProductCard from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
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
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="inline-flex items-center gap-4">
              Manufacturer Details
              <div className="flex gap-2">
                <EditManufacturerButton
                  manufacturer={manufacturer}
                  trigger={
                    <Button variant="secondary" size="icon" type="button">
                      <Pencil />
                    </Button>
                  }
                />
              </div>
            </div>
            <ActiveIndicator active={manufacturer.active} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
          <div className="grid gap-4">
            <Label>Properties</Label>
            <DataList
              details={[
                {
                  label: "Name",
                  value: manufacturer.name,
                },
                {
                  label: "Home URL",
                  value: manufacturer.homeUrl && (
                    <LinkPreview url={manufacturer.homeUrl} />
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
                  value: format(manufacturer.createdOn, "PPpp"),
                },
                {
                  label: "Last Updated",
                  value: format(manufacturer.modifiedOn, "PPpp"),
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fit,_minmax(28rem,_1fr))] gap-4">
            {manufacturer?.products?.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  manufacturerId: manufacturer.id,
                  manufacturer: manufacturer,
                }}
                navigateTo={`/products/all/${product.id}`}
                displayManufacturer={false}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
