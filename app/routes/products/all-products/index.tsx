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
import { useEffect, useMemo } from "react";
import { useImmer } from "use-immer";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/sessions";
import Icon from "~/components/icons/icon";
import LinkPreview from "~/components/link-preview";
import CustomTag from "~/components/products/custom-tag";
import EditProductButton from "~/components/products/edit-product-button";
import ProductCard from "~/components/products/product-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
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
import { useQueryNavigate } from "~/hooks/useQueryNavigate";
import type { Manufacturer, ProductCategory } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { isGlobalAdmin as isGlobalAdminFn } from "~/lib/users";
import { buildTitleFromBreadcrumb, getSearchParam } from "~/lib/utils";
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

  const showAllProducts = getSearchParam(request, "show-all");

  let onlyMyProducts = showAllProducts !== "true";
  if (!showAllProducts && isGlobalAdmin) {
    onlyMyProducts = false;
  }

  const query = { type: "PRIMARY", limit: 10000 } as QueryParams;

  if (onlyMyProducts) {
    query.client = {
      externalId: user.clientId,
    };
  }

  return api.products.list(request, query).mapTo((r) => ({
    products: r.results,
    isGlobalAdmin,
  }));
};

export default function AllProducts({
  loaderData: { products, isGlobalAdmin },
}: Route.ComponentProps) {
  // const navigate = useNavigate();
  const { setQuery, query } = useQueryNavigate();

  const grouping = useMemo(
    () => query.get("grp")?.split(",") || ["category"],
    [query]
  );
  const setGrouping = (
    value: GroupingState | ((prev: GroupingState) => GroupingState)
  ) => {
    const newValue = typeof value === "function" ? value(grouping) : value;
    setQuery((prev) => {
      prev.set("grp", newValue.join(","));
      return prev;
    });
  };

  const onlyMyProducts = useMemo(
    () => query.get("show-all") !== "true",
    [query]
  );
  const setOnlyMyProducts = (value: boolean) => {
    setQuery((prev) => {
      prev.set("show-all", String(!value));
      return prev;
    });
  };

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
    onGroupingChange: setGrouping,
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
                className="pl-8 h-9 w-[150px] lg:w-[250px]"
              />
              <Search className="absolute size-4 left-2 top-1/2 -translate-y-1/2" />
            </div>
            <Select
              value={grouping.at(0)}
              onValueChange={(value) => table.setGrouping([value])}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="category">Group by category</SelectItem>
                  <SelectItem value="manufacturer">
                    Group by manufacturer
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="onlyMyProducts"
                checked={onlyMyProducts}
                onCheckedChange={(checked) => setOnlyMyProducts(checked)}
              />
              <Label htmlFor="onlyMyProducts">Only My Products</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <EditProductButton canAssignOwnership={isGlobalAdmin} />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(28rem,_1fr))] gap-4 sm:gap-8">
        {table
          .getRowModel()
          .rows.filter((row) => row.getIsGrouped())
          .map(({ id, groupingColumnId, groupingValue, original, subRows }) => {
            return (
              <Collapsible
                key={id}
                className="group/collapsible grid col-span-full grid-cols-subgrid gap-2 sm:gap-4"
                defaultOpen
              >
                <CollapsibleTrigger asChild>
                  <Button
                    className="text-xl col-span-full px-2"
                    variant="ghost"
                    size="lg"
                  >
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
                  <div className="grid col-span-full grid-cols-subgrid gap-2 sm:gap-4">
                    {subRows.map(({ original: product }) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        displayCategory={!grouping.includes("category")}
                        displayManufacturer={!grouping.includes("manufacturer")}
                        navigateTo={product.id}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        {table.getRowModel().rows.filter((row) => row.getIsGrouped()).length ===
          0 && (
          <div className="py-6 flex flex-col items-center gap-4">
            No products found.
            {table.getState().globalFilter ? (
              <Button
                variant="outline"
                onClick={() => table.setGlobalFilter("")}
              >
                Clear Search
              </Button>
            ) : onlyMyProducts ? (
              <Button
                variant="outline"
                onClick={() => setOnlyMyProducts(false)}
              >
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
        <Badge className="text-sm uppercase w-max" variant="secondary">
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
