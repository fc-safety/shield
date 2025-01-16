import { type Column, type RowData, type Table } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronsUpDown,
  EyeOff,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { formatColumnId } from "./utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  table: Table<TData>;
  title?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  table,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  // if (!column.getCanSort()) {
  //   return <div className={cn(className)}>{title}</div>;
  // }

  const moveColumn = <TData extends RowData>(
    movingColumnId: Column<TData>["id"],
    direction: "left" | "right"
  ) => {
    let newColumnOrder = [...table.getState().columnOrder];
    if (!newColumnOrder.length) {
      newColumnOrder = table.getAllColumns().map((col) => col.id);
    }

    const currentIdx = newColumnOrder.indexOf(movingColumnId);
    const targetIdx = currentIdx + (direction === "left" ? -1 : 1);

    if (targetIdx > -1 && targetIdx < newColumnOrder.length) {
      newColumnOrder.splice(
        targetIdx,
        0,
        newColumnOrder.splice(currentIdx, 1)[0]
      );
      table.setColumnOrder(newColumnOrder);
    }
  };

  return (
    <div className={cn("inline-flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title ?? formatColumnId(column.id)}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp />
            ) : (
              <ChevronsUpDown />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            disabled={!column.getCanSort() || column.getIsSorted() === "asc"}
          >
            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            disabled={!column.getCanSort() || column.getIsSorted() === "desc"}
          >
            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.clearSorting()}
            disabled={!column.getCanSort() || !column.getIsSorted()}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />
            Clear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => moveColumn(column.id, "left")}
            disabled={column.getIsFirstColumn()}
          >
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground/70" />
            Move left
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => moveColumn(column.id, "right")}
            disabled={column.getIsLastColumn()}
          >
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/70" />
            Move right
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
