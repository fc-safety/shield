import { type Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import {
  DataTableFacetedFilter,
  type DataTableFacetedFilterProps,
} from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filters?:
    | DataTableFacetedFilterProps<TData, unknown>[]
    | ((props: {
        table: Table<TData>;
      }) => DataTableFacetedFilterProps<TData, unknown>[]);
  externalFilters?: React.ReactNode[];
  actions?:
    | React.ReactNode[]
    | ((props: { table: Table<TData> }) => React.ReactNode[]);
  searchPlaceholder?: string;
}

export function DataTableToolbar<TData>({
  table,
  filters = [],
  externalFilters = [],
  actions = [],
  searchPlaceholder = "Search...",
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between gap-x-4 gap-y-1 flex-wrap">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        <Input
          placeholder={searchPlaceholder}
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="text-sm sm:text-base h-8 min-w-[100px] max-w-[150px] lg:min-w-[175px] lg:max-w-[250px] flex-1"
        />
        {(typeof filters === "function" ? filters({ table }) : filters)
          .filter(({ column }) => !!column)
          .map((filter, idx) => (
            <DataTableFacetedFilter
              key={filter.column?.id ?? idx}
              {...filter}
            />
          ))}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
        {externalFilters}
      </div>
      <div className="flex items-center space-x-2">
        {typeof actions === "function" ? actions({ table }) : actions}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
