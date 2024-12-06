import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import {
  DataTableFacetedFilter,
  DataTableFacetedFilterProps,
} from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filters?:
    | DataTableFacetedFilterProps<TData, unknown>[]
    | ((props: {
        table: Table<TData>;
      }) => DataTableFacetedFilterProps<TData, unknown>[]);
  actions?:
    | React.ReactNode[]
    | ((props: { table: Table<TData> }) => React.ReactNode[]);
  searchPlaceholder?: string;
}

export function DataTableToolbar<TData>({
  table,
  filters: filtersProp = [],
  actions: actionsProp = [],
  searchPlaceholder = "Search...",
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const filters =
    typeof filtersProp === "function" ? filtersProp({ table }) : filtersProp;
  const actions =
    typeof actionsProp === "function" ? actionsProp({ table }) : actionsProp;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {filters
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
      </div>
      <div className="flex items-center space-x-2">
        {actions}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
