import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, CornerDownRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Alert, ResultsPage } from "~/lib/models";
import { cn } from "~/lib/utils";
import AssetInspectionAlert from "../assets/asset-inspection-alert";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import VirtualizedDataTable from "../data-table/virtualized-data-table";
import DisplayRelativeDate from "../display-relative-date";
import Icon from "../icons/icon";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import ErrorDashboardTile from "./error-dashboard-tile";
export default function InspectionAlertsOverview() {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error, isLoading } = useQuery({
    queryKey: ["inspection-alerts"],
    queryFn: () => getInspectionAlerts(fetch),
  });

  const columns: ColumnDef<Alert>[] = useMemo(
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
              {row.original.asset?.product?.productCategory?.icon && (
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
        accessorKey: "alertLevel",
        id: "level",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue, row: { original: alert } }) => {
          const level = getValue() as string;
          return (
            <span
              className={cn("capitalize rounded-md px-2 py-1", {
                "bg-urgent text-urgent-foreground":
                  !alert.resolved && level === "URGENT",
                "bg-important text-important-foreground":
                  !alert.resolved && level === "INFO",
                "bg-muted text-muted-foreground": alert.resolved,
              })}
            >
              {level.toLowerCase()}
            </span>
          );
        },
      },
      {
        accessorKey: "resolved",
        id: "resolved",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) =>
          getValue() ? (
            <Check className="size-5 text-status-ok" />
          ) : (
            <>&mdash;</>
          ),
      },
      {
        id: "view",
        cell: ({ row }) => (
          <AssetInspectionAlert
            assetId={row.original.assetId}
            alertId={row.original.id}
            trigger={
              <Button variant="secondary" size="sm">
                <CornerDownRight />
                Details
              </Button>
            }
          />
        ),
      },
    ],
    []
  );

  return error ? (
    <ErrorDashboardTile />
  ) : (
    <Card>
      <CardHeader>Inspection Alerts</CardHeader>
      <CardContent className="bg-inherit">
        <VirtualizedDataTable
          height="100%"
          maxHeight={400}
          columns={columns}
          data={data?.results ?? []}
          loading={isLoading}
          initialState={{
            sorting: [{ id: "date", desc: true }],
          }}
        />
      </CardContent>
    </Card>
  );
}
const getInspectionAlerts = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/alerts?limit=10000", {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<Alert>>;
};
