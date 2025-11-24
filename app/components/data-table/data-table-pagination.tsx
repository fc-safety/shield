import { type Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SELECT_COLUMN_ID } from "./columns";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const rowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="@container flex flex-wrap-reverse items-center justify-between gap-4 px-2">
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getAllColumns().findIndex((c) => c.id === SELECT_COLUMN_ID) > -1 ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of {rowCount} row
            {rowCount === 1 ? "" : "s"} selected.
          </>
        ) : (
          <>
            {rowCount} total row{rowCount === 1 ? "" : "s"}
          </>
        )}
      </div>
      <div className="flex flex-1 items-center space-x-4 @sm:space-x-6 @lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-xs font-medium @sm:text-sm">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs font-medium @sm:text-sm">
          Page{" "}
          <span className="whitespace-nowrap">
            {Math.min(table.getState().pagination.pageIndex + 1, table.getPageCount())} of{" "}
            {table.getPageCount()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 @lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 @lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
