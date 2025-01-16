import { type ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  CornerDownRight,
  Download,
  FilePlus,
  MoreHorizontal,
  Pencil,
  Printer,
  Trash,
} from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { getSelectColumn } from "~/components/data-table/columns";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface Report {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: string;
}

const columns: ColumnDef<Report>[] = [
  getSelectColumn<Report>(),
  {
    accessorKey: "title",
    cell: ({ getValue, row }) => (
      <Link to={`/reports/${row.original.id}`} className="hover:underline">
        {getValue() as string}
      </Link>
    ),
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} table={table} />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} table={table} />
    ),
  },
  {
    accessorKey: "createdAt",
    id: "created on",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} table={table} />
    ),

    cell: ({ getValue }) => (
      <span title={format(getValue() as string, "PPpp")}>
        {formatDistanceToNow(getValue() as string, {
          addSuffix: true,
          includeSeconds: true,
        })}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} table={table} />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const asset = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
            <DropdownMenuItem asChild>
              <Link to={`/reports/${asset.id}`}>
                <CornerDownRight />
                Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/reports/build/${asset.id}`}>
                <Pencil />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Download />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Printer />
              Print
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trash />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export const loader = () => {
  return {
    reports: [],
  };
};

export default function ReportsIndex() {
  const { reports } = useLoaderData<typeof loader>();

  return (
    <>
      <DataTable
        columns={columns}
        data={reports}
        searchPlaceholder="Search reports..."
        initialState={{
          sorting: [
            {
              id: "createdAt",
              desc: true,
            },
          ],
        }}
        actions={({ table }) => [
          <Button key="add" size="sm" asChild>
            <Link to="/reports/build">
              <FilePlus />
              Build Report
            </Link>
          </Button>,
          <DropdownMenu key="bulk-actions">
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!table.getIsSomeRowsSelected()}
              >
                Actions ({table.getSelectedRowModel().rows.length})
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Trash />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>,
        ]}
      />
    </>
  );
}
