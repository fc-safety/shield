import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  type GroupingState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, FireExtinguisher, Link2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRevalidator } from "react-router";
import { useImmer } from "use-immer";
import { api } from "~/.server/api";
import { buildImageProxyUrl } from "~/.server/images";
import { getAppState } from "~/.server/sessions";
import { requireUserSession } from "~/.server/user-sesssion";
import Icon from "~/components/icons/icon";
import LinkPreview from "~/components/link-preview";
import CustomTag from "~/components/products/custom-tag";
import EditProductButton from "~/components/products/edit-product-button";
import ProductCard from "~/components/products/product-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useAppState } from "~/contexts/app-state-context";
import { useAuth } from "~/contexts/auth-context";
import type { Manufacturer, ProductCategory } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { can, isGlobalAdmin as isGlobalAdminFn } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/index";

export const handle = {
  breadcrumb: () => ({
    label: "All Products",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);
  const isGlobalAdmin = isGlobalAdminFn(user);

  const { products_showAll } = await getAppState(request);

  let onlyMyProducts = !products_showAll;
  if (products_showAll === undefined && isGlobalAdmin) {
    onlyMyProducts = true;
  }

  const query = { type: "PRIMARY", limit: 10000 } as QueryParams;

  if (onlyMyProducts) {
    query.client = {
      externalId: user.clientId,
    };
  }

  return api.products
    .list(request, query, { context: isGlobalAdmin ? "admin" : "user" })
    .then((r) => ({
      products: r.results,
      optimizedProductImageUrls: new Map(
        r.results
          .filter(
            (
              p
            ): p is typeof p & {
              imageUrl: NonNullable<(typeof p)["imageUrl"]>;
            } => !!p.imageUrl
          )
          .map((p) => [p.id, buildImageProxyUrl(p.imageUrl, ["rs:fit:160:160:1:1"])])
      ),
      isGlobalAdmin,
      onlyMyProducts,
    }));
};

export default function AllProducts({
  loaderData: { products, optimizedProductImageUrls, isGlobalAdmin, onlyMyProducts },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canCreate = can(user, "create", "products");

  const { appState, setAppState } = useAppState();
  const { revalidate } = useRevalidator();

  const [grouping, setGrouping] = useState<GroupingState>(appState.products_grp ?? ["category"]);
  const handleSetGrouping = (value: GroupingState | ((prev: GroupingState) => GroupingState)) => {
    const newValue = typeof value === "function" ? value(grouping) : value;
    setGrouping(newValue);
    setAppState({
      products_grp: newValue,
    });
  };

  const handleSetOnlyMyProducts = useCallback(
    async (value: boolean) => {
      await setAppState({
        products_showAll: !value,
      });
      await revalidate();
    },
    [setAppState, revalidate]
  );

  const [sorting, setSorting] = useImmer<SortingState>([
    {
      id: grouping[0],
      desc: false,
    },
    {
      id: "name",
      desc: false,
    },
  ]);

  useEffect(() => {
    setSorting((draft) => {
      draft[0].id = grouping[0];
    });
  }, [setSorting, grouping]);

  const table = useReactTable({
    data: products,
    columns: [
      {
        accessorFn: (row) => row.productCategory.name,
        id: "category",
      },
      {
        accessorFn: (row) => row.manufacturer.name,
        id: "manufacturer",
      },
      {
        accessorKey: "name",
      },
    ],
    state: {
      grouping,
      sorting,
    },
    onGroupingChange: handleSetGrouping,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableMultiSort: true,
  });

  return (
    <div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <FireExtinguisher /> All Products
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative h-max">
              <Input
                placeholder="Search products..."
                value={(table.getState().globalFilter as string) ?? ""}
                onChange={(event) => table.setGlobalFilter(event.target.value)}
                className="h-9 w-[150px] pl-8 lg:w-[250px]"
              />
              <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2" />
            </div>
            <Select value={grouping.at(0)} onValueChange={(value) => table.setGrouping([value])}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="category">Group by category</SelectItem>
                  <SelectItem value="manufacturer">Group by manufacturer</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="onlyMyProducts"
                checked={onlyMyProducts}
                onCheckedChange={(checked) => handleSetOnlyMyProducts(checked)}
              />
              <Label htmlFor="onlyMyProducts">Only My Products</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canCreate && (
              <EditProductButton
                canAssignOwnership={isGlobalAdmin}
                viewContext={isGlobalAdmin ? "admin" : "user"}
              />
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(28rem,1fr))] gap-4 sm:gap-8">
        {table
          .getRowModel()
          .rows.filter((row) => row.getIsGrouped())
          .map(({ id, groupingColumnId, groupingValue, original, subRows }) => {
            return (
              <Collapsible
                key={id}
                className="group/collapsible col-span-full grid grid-cols-subgrid gap-2 sm:gap-4"
                defaultOpen
              >
                <CollapsibleTrigger asChild>
                  <Button className="col-span-full px-2 text-xl" variant="ghost" size="lg">
                    {groupingColumnId === "category" ? (
                      <CategoryLabel category={original.productCategory} />
                    ) : groupingColumnId === "manufacturer" ? (
                      <ManufacturerLabel manufacturer={original.manufacturer} />
                    ) : groupingColumnId ? (
                      (groupingValue as string)
                    ) : (
                      ""
                    )}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <div className="col-span-full grid grid-cols-subgrid gap-2 sm:gap-4">
                    {subRows.map(({ original: product }) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        displayCategory={!grouping.includes("category")}
                        displayManufacturer={!grouping.includes("manufacturer")}
                        navigateTo={product.id}
                        optimizedImageUrl={optimizedProductImageUrls.get(product.id)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        {table.getRowModel().rows.filter((row) => row.getIsGrouped()).length === 0 && (
          <div className="flex flex-col items-center gap-4 py-6">
            No products found.
            {table.getState().globalFilter ? (
              <Button variant="outline" onClick={() => table.setGlobalFilter("")}>
                Clear Search
              </Button>
            ) : onlyMyProducts ? (
              <Button variant="outline" onClick={() => handleSetOnlyMyProducts(false)}>
                Show All Products
              </Button>
            ) : (
              <></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryLabel({ category }: { category: ProductCategory }) {
  return (
    <span className="flex items-center gap-2">
      {category.icon && <Icon iconId={category.icon} color={category.color} />}
      {category.name}
      {category.shortName && (
        <Badge className="w-max text-sm uppercase" variant="secondary">
          {category.shortName}
        </Badge>
      )}
      {category.client && <CustomTag />}
    </span>
  );
}

function ManufacturerLabel({ manufacturer }: { manufacturer: Manufacturer }) {
  return (
    <span className="flex items-center gap-2">
      {manufacturer.name}
      {manufacturer.homeUrl && (
        <LinkPreview url={manufacturer.homeUrl}>
          <Button size="icon" variant="ghost" type="button">
            <Link2 />
          </Button>
        </LinkPreview>
      )}
      {manufacturer.client && <CustomTag />}
    </span>
  );
}
