import { type ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { type AssetHistoryLog } from "~/lib/demo-data";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";

interface AssetHistoryLogsProps {
  historyLogs: AssetHistoryLog[];
}

const columns: ColumnDef<AssetHistoryLog>[] = [
  {
    accessorKey: "timestamp",
    id: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
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
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    cell: ({ getValue }) => (
      <span className="capitalize">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "user.name",
    id: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
  },
  {
    accessorKey: "details",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Details" />
    ),
  },
];

export default function AssetHistoryLogs({
  historyLogs,
}: AssetHistoryLogsProps) {
  return (
    <>
      <DataTable
        data={historyLogs}
        columns={columns}
        initialState={{
          sorting: [
            {
              id: "date",
              desc: true,
            },
          ],
        }}
      />
    </>
  );
}
