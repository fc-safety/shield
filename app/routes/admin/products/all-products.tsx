import {
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  type GroupingState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { getProducts } from "~/.server/api";
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
import type { Route } from "./+types/all-products";

export const handle = {
  breadcrumb: () => ({
    label: "All Products",
  }),
};

export const loader = ({ request }: Route.LoaderArgs) => {
  return getProducts(request, { limit: 10000 });
};

export default function AdminAllProducts({
  loaderData: { results: products },
}: Route.ComponentProps) {
  const [search, setSearch] = useState("");

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
    enableMultiSort: true,
  });

  return (
    <div>
      <div className="px-8 mb-4 flex gap-4">
        <div className="relative h-max">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
      <div className="flex flex-col gap-8">
        {table
          .getRowModel()
          .rows.filter((row) => row.getIsGrouped())
          .map(({ id, groupingColumnId, groupingValue, original, subRows }) => {
            return (
              <Collapsible key={id} className="group/collapsible" defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button className="text-lg w-full" variant="ghost" size="lg">
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
                <CollapsibleContent>
                  <div className="pt-4 px-8 grid grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] gap-4">
                    {subRows.map(({ original: product }) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        displayCategory={!grouping.includes("category")}
                        displayManufacturer={!grouping.includes("manufacturer")}
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
