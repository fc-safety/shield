import { type ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import type { Inspection } from "~/lib/models";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";

interface AssetHistoryLogsProps {
  inspections: Inspection[];
}

const columns: ColumnDef<Inspection>[] = [
  {
    accessorKey: "createdOn",
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
    id: "user",
    accessorFn: (row) =>
      `${row.inspector?.firstName} ${row.inspector?.lastName}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
  },
  {
    accessorKey: "comments",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Comments" />
    ),
  },
];

export default function AssetInspections({
  inspections,
}: AssetHistoryLogsProps) {
  return (
    <>
      <DataTable
        data={inspections}
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
