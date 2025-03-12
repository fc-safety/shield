import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type InitialTableState,
  type RowData,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { cn } from "~/lib/utils";
import { DataTablePagination } from "./data-table-pagination";
import {
  DataTableToolbar,
  type DataTableToolbarProps,
} from "./data-table-toolbar";

import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "right" | "center";
  }
}

interface DataTableProps<TData, TValue>
  extends Omit<DataTableToolbarProps<TData>, "table"> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialState?: InitialTableState;
  hidePagination?: boolean;
  hideToolbar?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialState,
  hidePagination,
  hideToolbar,
  ...passThroughProps
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialState?.columnFilters ?? []
  );
  const [sorting, setSorting] = React.useState<SortingState>(
    initialState?.sorting ?? []
  );
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    initialState?.columnOrder ?? []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnOrder,
    },
    initialState,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      {!hideToolbar && <DataTableToolbar table={table} {...passThroughProps} />}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        idx === 0 ? "pl-4" : "",
                        idx === table.getVisibleFlatColumns().length - 1
                          ? "pr-4"
                          : "",
                        header.column.columnDef.meta?.align === "center"
                          ? "text-center"
                          : header.column.columnDef.meta?.align === "right"
                          ? "text-right"
                          : header.column.columnDef.meta?.align === "left"
                          ? "text-left"
                          : null
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, idx) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        idx === 0 ? "pl-4" : "",
                        idx === row.getVisibleCells().length - 1 ? "pr-4" : "",
                        cell.column.columnDef.meta?.align === "center"
                          ? "text-center"
                          : cell.column.columnDef.meta?.align === "right"
                          ? "text-right"
                          : cell.column.columnDef.meta?.align === "left"
                          ? "text-left"
                          : null
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!hidePagination && <DataTablePagination table={table} />}
    </div>
  );
}
