import { Link, useLoaderData } from "@remix-run/react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import RelativeTime from "dayjs/plugin/relativeTime";
import {
  ChevronDown,
  CornerDownRight,
  Download,
  FilePlus,
  MoreHorizontal,
  Printer,
  Trash,
} from "lucide-react";
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
import { Report } from "~/lib/demo-data";
import { demoReports } from "~/lib/demo-data-sources/reports";

dayjs.extend(LocalizedFormat);
dayjs.extend(RelativeTime);

const columns: ColumnDef<Report>[] = [
  getSelectColumn<Report>(),
  {
    accessorKey: "title",
    cell: ({ getValue, row }) => (
      <Link to={`/reports/${row.original.id}`} className="hover:underline">
        {getValue() as string}
      </Link>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created On" />
    ),
    cell: ({ getValue }) => (
      <span title={dayjs(getValue() as string).format("llll")}>
        {dayjs(getValue() as string).fromNow()}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
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
    reports: demoReports,
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
