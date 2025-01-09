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
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { getValidatedFormData } from "remix-hook-form";
import { useImmer } from "use-immer";
import type { z } from "zod";
import { api } from "~/.server/api";
import NewProductButton from "~/components/products/new-product-button";
import ProductCard from "~/components/products/product-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { ProductCategory } from "~/lib/models";
import {
  type createProductSchema,
  createProductSchemaResolver,
} from "~/lib/schema";
import type { Route } from "./+types/index";

export const handle = {
  breadcrumb: () => ({
    label: "All Products",
  }),
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { data, errors } = await getValidatedFormData<
    z.infer<typeof createProductSchema>
  >(request, createProductSchemaResolver);

  if (errors) {
    throw Response.json({ errors }, { status: 400 });
  }

  return api.products.create(request, data);
};

export const loader = ({ request }: Route.LoaderArgs) => {
  return api.products.list(request, { limit: 10000 });
};

export default function AllProducts({
  loaderData: { results: products },
}: Route.ComponentProps) {
  const [grouping, setGrouping] = useState<GroupingState>(["category"]);
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
      <div className="mb-4 flex items-center justify-between">
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
        </div>
        <div className="flex items-center space-x-2">
          <NewProductButton />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(350px,_1fr))] gap-4 sm:gap-8">
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
                    className="text-lg col-span-full"
                    variant="ghost"
                    size="lg"
                  >
                    {groupingColumnId === "category" ? (
                      <CategoryLabel category={original.productCategory} />
                    ) : groupingColumnId ? (
                      (groupingValue as string)
                    ) : (
                      ""
                    )}
                    <ChevronRight className="inline ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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
      </div>
    </div>
  );
}

function CategoryLabel({ category }: { category: ProductCategory }) {
  return (
    <span>
      {category.name}
      {category.shortName && (
        <Badge className="text-sm uppercase w-max ml-2" variant="secondary">
          {category.shortName}
        </Badge>
      )}
    </span>
  );
}
