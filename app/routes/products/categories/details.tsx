import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  FireExtinguisher,
  Pencil,
  Shapes,
  ShieldQuestion,
  SquareStack,
  type LucideIcon,
} from "lucide-react";
import { type To, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import ActiveIndicator from "~/components/active-indicator";
import DataList from "~/components/data-list";
import Icon from "~/components/icons/icon";
import AssetQuestionsTable from "~/components/products/asset-questions-table";
import CustomTag from "~/components/products/custom-tag";
import EditProductButton from "~/components/products/edit-product-button";
import EditProductCategoryButton from "~/components/products/edit-product-category-button";
import ProductCard from "~/components/products/product-card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/contexts/auth-context";
import type { Manufacturer, Product, ProductCategory } from "~/lib/models";
import { can, isGlobalAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.productCategory.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  return api.productCategories.get(request, id).mapWith((productCategory) =>
    api.manufacturers.get(request, "generic").mapTo((manufacturer) => ({
      productCategory,
      genericManufacturer: manufacturer,
    }))
  );
};

export default function ProductCategoryDetails({
  loaderData: { productCategory, genericManufacturer },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canUpdate =
    can(user, "update", "product-categories") &&
    (isGlobalAdmin(user) ||
      productCategory.client?.externalId === user.clientId);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <Shapes />
              <div className="inline-flex items-center gap-4">
                Product Category Details
                <div className="flex gap-2">
                  {canUpdate && (
                    <EditProductCategoryButton
                      productCategory={productCategory}
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
              <ActiveIndicator active={productCategory.active} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="grid gap-4">
              <Label>Properties</Label>
              <DataList
                details={[
                  {
                    label: "Name",
                    value: productCategory.name,
                  },
                  {
                    label: "Code",
                    value: productCategory.shortName,
                  },
                  {
                    label: "Description",
                    value: productCategory.description,
                  },
                  {
                    label: "Icon",
                    value: productCategory.icon && (
                      <Icon
                        iconId={productCategory.icon}
                        color={productCategory.color}
                      />
                    ),
                  },
                  {
                    label: "Owner",
                    value: productCategory.client ? (
                      <CustomTag text={productCategory.client.name} />
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
                    value: format(productCategory.createdOn, "PPpp"),
                  },
                  {
                    label: "Last Updated",
                    value: format(productCategory.modifiedOn, "PPpp"),
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
              <ShieldQuestion /> Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQuestionsTable
              questions={productCategory.assetQuestions ?? []}
              readOnly={!canUpdate}
              parentType="productCategory"
              parentId={productCategory.id}
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
        <ProductsCard
          products={
            productCategory?.products?.filter((p) => p.type === "PRIMARY") ?? []
          }
          title="Primary Products"
          icon={FireExtinguisher}
          productCategory={productCategory}
          navigateTo={(p) => `/products/all/${p.id}`}
        />
        <ProductsCard
          products={
            productCategory?.products?.filter(
              (p) =>
                p.type === "CONSUMABLE" &&
                p.manufacturerId === genericManufacturer.id
            ) ?? []
          }
          title="Generic Subproducts"
          icon={SquareStack}
          productCategory={productCategory}
          manufacturer={genericManufacturer}
          consumable
        />
      </div>
    </div>
  );
}

function ProductsCard({
  products,
  productCategory,
  manufacturer,
  consumable,
  title,
  icon: Icon,
  navigateTo,
}: {
  products: Omit<Product, "productCategory">[];
  productCategory: ProductCategory;
  manufacturer?: Manufacturer;
  consumable?: boolean;
  title: string;
  icon: LucideIcon;
  navigateTo?: (product: Omit<Product, "productCategory">) => To;
}) {
  const { user } = useAuth();
  const canCreate = can(user, "create", "products");
  const getCanUpdate = (product: Omit<Product, "productCategory">) =>
    can(user, "update", "products") &&
    (isGlobalAdmin(user) || product.client?.externalId === user.clientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Icon /> {title}
          <div className="flex-1"></div>
          {canCreate && (
            <EditProductButton
              productCategory={productCategory}
              manufacturer={manufacturer}
              consumable={consumable}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fit,_minmax(28rem,_1fr))] gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                productCategoryId: productCategory.id,
                productCategory: productCategory,
              }}
              displayCategory={!!product.ansiCategory}
              navigateTo={navigateTo?.(product)}
              renderEditButton={() =>
                getCanUpdate(product) ? (
                  <EditProductButton
                    product={{
                      ...product,
                      productCategoryId: productCategory.id,
                      productCategory: productCategory,
                    }}
                    productCategory={productCategory}
                    manufacturer={manufacturer}
                    consumable={consumable}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                  />
                ) : null
              }
            />
          ))}
          {!products.length && (
            <span className="text-sm text-muted-foreground col-span-full text-center">
              No {title.toLowerCase()} found.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
