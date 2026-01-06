import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, FireExtinguisher, Pencil } from "lucide-react";
import { type UIMatch } from "react-router";
import { api } from "~/.server/api";
import { buildImageProxyUrl } from "~/.server/images";
import { requireUserSession } from "~/.server/user-sesssion";
import ActiveIndicator from "~/components/active-indicator";
import HydrationSafeFormattedDate from "~/components/common/hydration-safe-formatted-date";
import DataList from "~/components/data-list";
import LinkPreview from "~/components/link-preview";
import CustomTag from "~/components/products/custom-tag";
import EditManufacturerButton from "~/components/products/edit-manufacturer-button";
import ProductCard from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/contexts/auth-context";
import { can, isGlobalAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.manufacturer.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const { user } = await requireUserSession(request);

  return api.manufacturers.get(request, id).then((manufacturer) => {
    return {
      manufacturer,
      canEdit: isGlobalAdmin(user) || manufacturer.client?.externalId === user.clientId,
      optimizedProductImageUrls: new Map(
        (manufacturer.products ?? [])
          .filter(
            (
              p
            ): p is typeof p & {
              imageUrl: NonNullable<(typeof p)["imageUrl"]>;
            } => !!p.imageUrl
          )
          .map((p) => [p.id, buildImageProxyUrl(p.imageUrl, ["rs:fit:160:160:1:1"])])
      ),
    };
  });
};

export default function ProductManufacturerDetails({
  loaderData: { manufacturer, optimizedProductImageUrls },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const canUpdate =
    can(user, "update", "manufacturers") &&
    (userIsGlobalAdmin || manufacturer.client?.externalId === user.clientId);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Factory />
            <div className="inline-flex items-center gap-4">
              Manufacturer Details
              <div className="flex gap-2">
                {canUpdate && (
                  <EditManufacturerButton
                    manufacturer={manufacturer}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            <div className="flex-1"></div>
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
                  value: manufacturer.homeUrl && <LinkPreview url={manufacturer.homeUrl} />,
                },
                {
                  label: "Owner",
                  value: manufacturer.client ? (
                    <CustomTag text={manufacturer.client.name} />
                  ) : (
                    <>&mdash;</>
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
                  value: (
                    <HydrationSafeFormattedDate date={manufacturer.createdOn} formatStr="PPpp" />
                  ),
                },
                {
                  label: "Last Updated",
                  value: (
                    <HydrationSafeFormattedDate date={manufacturer.modifiedOn} formatStr="PPpp" />
                  ),
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <FireExtinguisher /> Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(28rem,1fr))] gap-4">
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
                optimizedImageUrl={optimizedProductImageUrls.get(product.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
