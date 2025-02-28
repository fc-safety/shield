import { type ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import type { Inspection } from "~/lib/models";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import AssetInspectionDialog from "./asset-inspection-dialog";

interface AssetHistoryLogsProps {
  inspections: Inspection[];
}

export default function AssetInspections({
  inspections,
}: AssetHistoryLogsProps) {
  const columns: ColumnDef<Inspection>[] = useMemo(
    () => [
      {
        accessorKey: "createdOn",
        id: "date",
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
        id: "inspector",
        accessorFn: (row) =>
          `${row.inspector?.firstName} ${row.inspector?.lastName}`,
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "comments",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() || <>&mdash;</>,
      },
      {
        id: "details",
        cell: ({ row }) => (
          <AssetInspectionDialog inspectionId={row.original.id} />
        ),
      },
    ],
    []
  );

  return (
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
  );
}
