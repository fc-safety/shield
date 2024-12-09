import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import RelativeTime from "dayjs/plugin/relativeTime";
import { AssetHistoryLog } from "~/lib/demo-data";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";

dayjs.extend(LocalizedFormat);
dayjs.extend(RelativeTime);

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
      <span title={dayjs(getValue() as string).format("llll")}>
        {dayjs(getValue() as string).fromNow()}
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
