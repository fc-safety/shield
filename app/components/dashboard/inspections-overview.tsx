import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "react-router";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Inspection, ResultsPage } from "~/lib/models";
import { getUserDisplayName } from "~/lib/users";
import AssetInspectionDialog from "../assets/asset-inspection-dialog";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import VirtualizedDataTable from "../data-table/virtualized-data-table";
import DisplayRelativeDate from "../display-relative-date";
import Icon from "../icons/icon";
import { Card, CardContent, CardHeader } from "../ui/card";
import BlankDashboardTile from "./blank-dashboard-tile";
import ErrorDashboardTile from "./error-dashboard-tile";

export default function InspectionsOverview() {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error } = useQuery({
    queryKey: ["recent-inspections"],
    queryFn: () => getRecentInspections(fetch),
  });

  const columns: ColumnDef<Inspection>[] = useMemo(
    () => [
      {
        accessorKey: "createdOn",
        id: "date",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => (
          <DisplayRelativeDate date={getValue() as string} />
        ),
      },
      {
        accessorKey: "asset.name",
        id: "asset",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row, getValue }) => {
          const assetName = getValue() as string;
          return (
            <Link
              to={row.original.asset ? `/assets/${row.original.asset.id}` : "#"}
              className="flex items-center gap-2 group"
            >
              {row.original.asset.product.productCategory.icon && (
                <Icon
                  iconId={row.original.asset.product.productCategory.icon}
                  color={row.original.asset.product.productCategory.color}
                  className="text-lg"
                />
              )}
              <span className="group-hover:underline">{assetName}</span>
            </Link>
          );
        },
      },
      {
        accessorFn: (inspection) =>
          inspection.inspector && getUserDisplayName(inspection.inspector),
        id: "inspector",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
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

  return data ? (
    <Card>
      <CardHeader>Inspections Overview</CardHeader>
      <CardContent className="bg-inherit">
        <VirtualizedDataTable
          height="100%"
          maxHeight={400}
          columns={columns}
          initialState={{
            sorting: [{ id: "date", desc: true }],
          }}
          data={data.results}
        />
      </CardContent>
    </Card>
  ) : error ? (
    <ErrorDashboardTile />
  ) : (
    <BlankDashboardTile className="animate-pulse" />
  );
}

const getRecentInspections = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/inspections?limit=10000", {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<Inspection>>;
};
