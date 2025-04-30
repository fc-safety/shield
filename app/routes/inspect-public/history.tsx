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
import { CircleAlert, CircleCheck, CircleSlash, LogIn } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { defaultDataGetter, FetchOptions } from "~/.server/api-utils";
import { validateInspectionSession } from "~/.server/inspections";
import AssetCard from "~/components/assets/asset-card";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Asset, Inspection } from "~/lib/models";
import { getUserDisplayName } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import { INSPECTION_TOKEN_HEADER } from "../inspect/constants/headers";
import type { Route } from "./+types/history";

export const handle = {
  breadcrumb: () => ({ label: "History" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { inspectionToken } = await validateInspectionSession(request);

  const { url, options } = FetchOptions.url("/inspections-public/history")
    .get()
    .setHeader(INSPECTION_TOKEN_HEADER, inspectionToken)
    .build();

  return await defaultDataGetter<{
    asset: Asset | null;
    inspections: Inspection[];
  }>(fetch(url, options));
};

export default function PublicInspectHistoryView({
  loaderData: { asset, inspections },
}: Route.ComponentProps) {
  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full grow w-full max-w-sm">
        <CircleSlash className="size-16 text-destructive" />
        <h2 className="text-lg font-semibold text-center">
          This tag has not yet been registered to an asset.
        </h2>
        <Button asChild>
          <Link to="/inspect/register?intent=register-tag">
            <LogIn /> Login to Register Tag
          </Link>
        </Button>
      </div>
    );
  }

  return <PublicInspectHistory asset={asset} inspections={inspections} />;
}

function PublicInspectHistory({
  asset,
  inspections,
}: {
  asset: Asset;
  inspections: Inspection[];
}) {
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
    <div className="w-full max-w-md flex flex-col items-stretch gap-4">
      <AssetCard asset={asset} />

      <Card>
        <CardHeader>
          <CardTitle>Inspection Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isEmpty && (
              <p className="text-sm text-muted-foreground">
                This asset has no inspection logs yet.
              </p>
            )}
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
                        Inspected {formatDistanceToNow(inspection.createdOn)} by{" "}
                        {renderCell(cells.inspector)}.
                      </p>
                    </div>

                    {renderAlerts(inspection.alerts)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
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
