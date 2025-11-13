import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { CircleAlert, CircleCheck, CircleSlash, CircleX, LogIn } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { defaultDataGetter, FetchOptions } from "~/.server/api-utils";
import { buildImageProxyUrl } from "~/.server/images";
import { validateInspectionSession } from "~/.server/inspections";
import AssetCard from "~/components/assets/asset-card";
import HydrationSafeFormattedDate from "~/components/common/hydration-safe-formatted-date";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Alert, Asset, Inspection } from "~/lib/models";
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
    unresolvedAlerts: Alert[];
    inspections: Inspection[];
  }>(fetch(url, options)).then((results) => ({
    ...results,
    processedProductImageUrl:
      results.asset?.product.imageUrl &&
      buildImageProxyUrl(results.asset.product.imageUrl, ["rs:fit:160:160:1:1"]),
  }));
};

export default function PublicInspectHistoryView({
  loaderData: { asset, inspections, unresolvedAlerts, processedProductImageUrl },
}: Route.ComponentProps) {
  if (!asset) {
    return (
      <div className="flex h-full w-full max-w-sm grow flex-col items-center justify-center gap-2">
        <CircleSlash className="text-destructive size-16" />
        <h2 className="text-center text-lg font-semibold">
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

  return (
    <PublicInspectHistory
      asset={asset}
      inspections={inspections}
      unresolvedAlerts={unresolvedAlerts}
      processedProductImageUrl={processedProductImageUrl}
    />
  );
}

function PublicInspectHistory({
  asset,
  inspections,
  unresolvedAlerts,
  processedProductImageUrl,
}: {
  asset: Asset;
  inspections: Inspection[];
  unresolvedAlerts: Alert[];
  processedProductImageUrl: string | null | undefined;
}) {
  const columns = useMemo(
    (): ColumnDef<Inspection>[] => [
      {
        header: "Inspection Date",
        accessorKey: "createdOn",
        cell: ({ getValue }) => (
          <HydrationSafeFormattedDate date={getValue() as string} formatStr="PPpp" />
        ),
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
    <div className="flex w-full max-w-md flex-col items-stretch gap-4">
      <AssetCard asset={asset} processedProductImageUrl={processedProductImageUrl} />

      {unresolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {unresolvedAlerts.length} Unresolved Alert
              {unresolvedAlerts.length === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-border divide-y">
              {unresolvedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-1 py-1.5 text-sm">
                  {alert.alertLevel === "URGENT" ? (
                    <CircleX className="text-urgent size-4 shrink-0" />
                  ) : (
                    <CircleAlert className="text-important size-4 shrink-0" />
                  )}
                  <p className="font-semibold">{alert.alertLevel}</p>
                  &mdash;
                  <p className="italic">
                    triggered{" "}
                    {formatDistanceToNow(alert.createdOn, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inspection Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isEmpty && (
              <p className="text-muted-foreground text-sm">
                This asset has no inspection logs yet.
              </p>
            )}
            {rows.map((row) => {
              const inspection = row.original;
              const cells = row.getVisibleCells().reduce(
                (acc, cell) => {
                  acc[String(cell.column.id)] = cell;
                  return acc;
                },
                {} as Record<string, Cell<Inspection, unknown>>
              );

              return (
                <Card key={inspection.id} className="bg-background text-foreground">
                  <CardContent className="flex flex-col gap-2 pt-4 sm:pt-6">
                    <div>
                      <p className="text-muted-foreground mb-0.5 text-xs">
                        {renderCell(cells.createdOn)}
                      </p>
                      <p className="text-sm">
                        Inspected{" "}
                        {formatDistanceToNow(inspection.createdOn, {
                          addSuffix: true,
                        })}{" "}
                        by {renderCell(cells.inspector)}.
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
        <CircleCheck className="text-primary size-4 shrink-0" />
      ) : (
        <CircleAlert className="text-important size-4 shrink-0" />
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
