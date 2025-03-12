import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type InitialTableState,
  type Row,
  type SortingState,
  type Table as TTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, type CSSProperties } from "react";
import { Table, TableBody, TableHeader, TableRow } from "../ui/table";
import { DataTableCell, DataTableHead } from "./data-table";
import {
  DataTableToolbar,
  type DataTableToolbarProps,
} from "./data-table-toolbar";

interface Props<TData, TValue>
  extends Omit<DataTableToolbarProps<TData>, "table"> {
  height: CSSProperties["height"];
  maxHeight?: CSSProperties["maxHeight"];
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialState?: InitialTableState;
  hideToolbar?: boolean;
}

export default function VirtualizedTable<TData, TValue>({
  height,
  maxHeight,
  columns,
  data,
  initialState,
  hideToolbar,
  ...passThroughProps
}: Props<TData, TValue>) {
  // The virtualizer will need a reference to the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility ?? {}
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialState?.columnFilters ?? []
  );
  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting ?? []
  );
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
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
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4 bg-inherit">
      {!hideToolbar && <DataTableToolbar table={table} {...passThroughProps} />}
      <Table
        className="grid bg-inherit"
        style={{
          width: table.options.enableColumnResizing
            ? table.getCenterTotalSize()
            : undefined,
        }}
        containerProps={{
          className: "relative overflow-auto bg-inherit rounded-md border",
          style: {
            height,
            maxHeight,
          },
          ref: tableContainerRef,
        }}
      >
        <TableHeader className="grid sticky top-0 z-10 bg-inherit">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="flex w-full">
              {headerGroup.headers.map((header, idx) => (
                <DataTableHead
                  key={header.id}
                  table={table}
                  header={header}
                  idx={idx}
                  style={{
                    width: header.getSize(),
                  }}
                  className="inline-flex items-center shrink-0"
                />
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <VirtualizedTableBody
          table={table}
          tableContainerRef={tableContainerRef}
        />
      </Table>
    </div>
  );
}

function VirtualizedTableBody<TData>({
  table,
  tableContainerRef,
}: {
  table: TTable<TData>;
  tableContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const { rows } = table.getRowModel();

  // Important: Keep the row virtualizer in the lowest component possible to avoid unnecessary re-renders.
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <TableBody
      className="relative grid"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<TData>;
        return (
          <TableRow
            key={row.id}
            data-index={virtualRow.index} //needed for dynamic row height measurement
            ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
            className="absolute w-full flex"
            style={{
              transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
            }}
          >
            {row.getVisibleCells().map((cell, idx) => (
              <DataTableCell
                key={cell.id}
                row={row}
                cell={cell}
                idx={idx}
                style={{
                  width: cell.column.getSize(),
                }}
                className="inline-flex shrink-0 items-center"
              />
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  );
}
