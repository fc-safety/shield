import {
  type Cell,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type Header,
  type InitialTableState,
  type Row,
  type RowData,
  type SortingState,
  type Table as TTable,
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
import type { ComponentProps } from "react";

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
  classNames?: {
    container?: string;
    body?: string;
  };
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialState,
  hidePagination,
  hideToolbar,
  classNames,
  getRowId,
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
    getRowId,
  });

  return (
    <div
      className={cn("flex flex-col gap-y-4 bg-inherit", classNames?.container)}
    >
      {!hideToolbar && <DataTableToolbar table={table} {...passThroughProps} />}
      <div className="flex-1 min-h-0 rounded-md border flex flex-col bg-inherit">
        <Table
          className="bg-inherit h-full rounded-[inherit]"
          containerProps={{
            className: "h-full bg-inherit rounded-[inherit] flex flex-col",
          }}
        >
          <TableHeader className="sticky top-0 z-10 bg-inherit rounded-t-[inherit]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => {
                  return (
                    <DataTableHead
                      key={header.id}
                      header={header}
                      idx={idx}
                      table={table}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={cn("min-h-0 flex-1", classNames?.body)}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, idx) => (
                    <DataTableCell
                      key={cell.id}
                      cell={cell}
                      idx={idx}
                      row={row}
                    />
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

export function DataTableHead<TData, TValue>({
  header,
  idx,
  table,
  className,
  ...props
}: {
  header: Header<TData, TValue>;
  idx: number;
  table: TTable<TData>;
} & ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      colSpan={header.colSpan}
      className={cn(
        idx === 0 ? "pl-4" : "",
        idx === table.getVisibleFlatColumns().length - 1 ? "pr-4" : "",
        header.column.columnDef.meta?.align === "center"
          ? "justify-center text-center"
          : header.column.columnDef.meta?.align === "right"
          ? "justify-end text-end"
          : header.column.columnDef.meta?.align === "left"
          ? "justify-start text-start"
          : null,
        className
      )}
      {...props}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </TableHead>
  );
}

export function DataTableCell<TData, TValue>({
  cell,
  idx,
  row,
  className,
  ...props
}: {
  cell: Cell<TData, TValue>;
  idx: number;
  row: Row<TData>;
} & ComponentProps<typeof TableCell>) {
  return (
    <TableCell
      key={cell.id}
      className={cn(
        idx === 0 ? "pl-4" : "",
        idx === row.getVisibleCells().length - 1 ? "pr-4" : "",
        cell.column.columnDef.meta?.align === "center"
          ? "justify-center text-center"
          : cell.column.columnDef.meta?.align === "right"
          ? "justify-end text-end"
          : cell.column.columnDef.meta?.align === "left"
          ? "justify-start text-start"
          : null,
        className
      )}
      {...props}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}
