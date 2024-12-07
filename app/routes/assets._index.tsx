import { Link, useLoaderData } from "@remix-run/react";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  ChevronDown,
  CornerDownRight,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShieldClose,
  SquareActivity,
  Trash,
  TriangleAlert,
  XCircle,
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
import { Asset, assetStatuses, assetTypes, demoAssets } from "~/lib/demo-data";

const columns: ColumnDef<Asset>[] = [
  getSelectColumn<Asset>(),
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
  },
  {
    accessorKey: "tag",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tag" />
    ),
  },
  {
    accessorKey: "site",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Site" />
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
  },
  {
    accessorKey: "placement",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Placement" />
    ),
  },
  {
    accessorKey: "manufactuer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Manufactuer" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => {
      const status = getValue();
      return status === "ok" ? (
        <ShieldCheck className="text-green-500" />
      ) : status === "warning" ? (
        <ShieldAlert className="text-yellow-500" />
      ) : (
        <ShieldClose className="text-red-500" />
      );
    },
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
              <Link to={`/assets/${asset.id}`}>
                <CornerDownRight />
                Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <SquareActivity />
              Inspect
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
    assets: demoAssets,
  };
};

export default function AssetsIndex() {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <DataTable
        columns={columns}
        data={data.assets}
        searchPlaceholder="Search assets..."
        filters={({ table }) => [
          {
            column: table.getColumn("type"),
            options: assetTypes.map((type) => ({ label: type, value: type })),
            title: "Type",
          },
          {
            column: table.getColumn("status"),
            options: assetStatuses.map((type) => ({
              label: type,
              value: type,
              icon:
                type === "ok"
                  ? CheckCircle2
                  : type === "warning"
                  ? TriangleAlert
                  : XCircle,
            })),
            title: "Status",
          },
        ]}
        actions={({ table }) => [
          <Button key="add" size="sm">
            <Plus />
            Add Asset
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
                <SquareActivity />
                Update Status
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash />
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>,
        ]}
      />
    </>
  );
}
