import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
} from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { CircleAlert, CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { defaultDataGetter, FetchOptions } from "~/.server/api-utils";
import { getSession, inspectionSessionStorage } from "~/.server/sessions";
import AssetCard from "~/components/assets/asset-card";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Asset, Inspection } from "~/lib/models";
import { getUserDisplayName } from "~/lib/users";
import { INSPECTION_TOKEN_HEADER } from "../inspect/constants/headers";
import type { Route } from "./+types/history";
import ShieldBannerLogo from "./components/shield-banner-logo";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const inspectionSession = await getSession(request, inspectionSessionStorage);

  const { url, options } = FetchOptions.url("/inspections-public/history")
    .get()
    .setHeader(
      INSPECTION_TOKEN_HEADER,
      inspectionSession.get("inspectionToken") ?? ""
    )
    .build();

  return await defaultDataGetter<{
    asset: Asset;
    inspections: Inspection[];
  }>(fetch(url, options));
};

export default function PublicInspectHistory({
  loaderData: { asset, inspections },
}: Route.ComponentProps) {
  const columns = useMemo(
    (): ColumnDef<Inspection>[] => [
      {
        header: "Inspection Date",
        accessorKey: "createdOn",
        cell: ({ getValue }) => format(getValue() as string, "PPpp"),
      },
      {
        header: "Inspector",
        accessorKey: "inspector",
        cell: ({ getValue }) => {
          const inspector = getValue();
          if (!inspector) {
            return "Unknown Inspector";
          }
          return getUserDisplayName(inspector);
        },
      },
      {
        header: "Unresolved Alerts",
        accessorKey: "alerts",
        cell: ({ getValue }) => {
          const alerts = getValue() as Inspection["alerts"];
          if (!alerts) {
            return <>&mdash;</>;
          }

          const unresolvedAlerts = alerts.filter((alert) => !alert.resolved);

          const totalAlertsCount = unresolvedAlerts.length;
          const urgentAlertsCount = unresolvedAlerts.filter(
            (alert) => alert.alertLevel === "URGENT"
          ).length;
          const infoAlertsCount = unresolvedAlerts.filter(
            (alert) => alert.alertLevel === "INFO"
          ).length;

          return totalAlertsCount === 0 ? (
            <span>
              <strong>0</strong> alerts.
            </span>
          ) : (
            <span>
              <strong>{totalAlertsCount}</strong> alert
              {totalAlertsCount === 1 ? "" : "s"}:{" "}
              <span className="text-urgent">
                <strong> {urgentAlertsCount}</strong> urgent,
              </span>{" "}
              <span className="text-important">
                <strong>{infoAlertsCount}</strong> info
              </span>
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: inspections,
    columns,
    initialState: {
      sorting: [{ id: "createdOn", desc: true }],
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();
  const isEmpty = !rows.length;

  return (
    <div className="w-full flex flex-col items-center gap-12">
      <ShieldBannerLogo />
      <div className="w-full flex flex-col gap-4">
        <AssetCard asset={asset} />

        <Card>
          <CardHeader>
            <CardTitle>Inspection Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {rows.map((row) => {
                const inspection = row.original;
                const cells = row.getVisibleCells().reduce((acc, cell) => {
                  acc[String(cell.column.id)] = cell;
                  return acc;
                }, {} as Record<string, Cell<Inspection, unknown>>);

                return (
                  <Card
                    key={inspection.id}
                    className="bg-background text-foreground"
                  >
                    <CardContent className="pt-4 sm:pt-6 flex flex-col gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {renderCell(cells.createdOn)}
                        </p>
                        <p className="text-sm">
                          Inspected {formatDistanceToNow(inspection.createdOn)}{" "}
                          by {renderCell(cells.inspector)}.
                        </p>
                      </div>

                      {renderAlerts(inspection.alerts)}

                      {/* <DataList
                        classNames={{
                          details: "gap-1",
                        }}
                        details={[
                          {
                            label: "Date",
                            value: renderCell(cells.createdOn),
                          },
                          {
                            label: "Unresolved Alerts",
                            value: renderCell(cells.alerts),
                          },
                        ]}
                        fluid
                      /> */}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const renderCell = (cell: Cell<Inspection, unknown> | undefined | null) =>
  cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;

const renderAlerts = (alerts: Inspection["alerts"]) => {
  if (!alerts) {
    return null;
  }

  const unresolvedAlerts = alerts.filter((alert) => !alert.resolved);

  return (
    <div className="flex gap-1">
      {unresolvedAlerts.length === 0 ? (
        <CircleCheck className="size-4 text-primary shrink-0" />
      ) : (
        <CircleAlert className="size-4 text-important shrink-0" />
      )}
      <p className="text-xs italic">
        This inspection triggered <strong>{alerts.length}</strong> alert
        {alerts.length === 1 ? "" : "s"}
        {alerts.length === 0 ? (
          "."
        ) : (
          <>
            , <strong>{unresolvedAlerts.length}</strong> of which{" "}
            {unresolvedAlerts.length === 1 ? "remains" : "remain"} unresolved.
          </>
        )}
      </p>
    </div>
  );
};
