import { type ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { CornerDownRight, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import type { Inspection } from "~/lib/models";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import InspectionDetails from "./inspection-details";

interface AssetHistoryLogsProps {
  inspections: Inspection[];
  googleMapsApiKey: string;
}

export default function AssetInspections({
  inspections,
  googleMapsApiKey,
}: AssetHistoryLogsProps) {
  const [inspectionDetailsOpen, setInspectionDetailsOpen] = useState(false);
  const fetcher = useFetcher<Inspection>();

  const handlePreloadInspectionDetails = useCallback(
    (id: string) => {
      if (
        fetcher.state === "idle" &&
        (!fetcher.data || fetcher.data.id !== id)
      ) {
        fetcher.load(`/api/inspections/${id}`);
      }
    },
    [fetcher]
  );

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
      },
      {
        id: "details",
        cell: ({ row }) => (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onMouseEnter={() => handlePreloadInspectionDetails(row.original.id)}
            onClick={() => setInspectionDetailsOpen(true)}
          >
            <CornerDownRight />
            Details
          </Button>
        ),
      },
    ],
    [handlePreloadInspectionDetails]
  );

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
      <ResponsiveDialog
        open={inspectionDetailsOpen}
        onOpenChange={setInspectionDetailsOpen}
        title="Inspection Details"
        dialogClassName="sm:max-w-lg"
        minWidth="578px"
      >
        {!fetcher.data || fetcher.state === "loading" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <InspectionDetails
            inspection={fetcher.data}
            googleMapsApiKey={googleMapsApiKey}
          />
        )}
      </ResponsiveDialog>
    </>
  );
}
