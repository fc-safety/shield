import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { format, subDays } from "date-fns";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Info,
  LayoutDashboard,
  List,
  OctagonAlert,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAppState, useAppStateValue } from "~/contexts/app-state-context";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { AlertLevels, type Alert, type ResultsPage } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { stringifyQuery } from "~/lib/urls";
import { hasMultiSiteVisibility } from "~/lib/users";
import { cn, humanize } from "~/lib/utils";
import AssetInspectionAlert from "../assets/asset-inspection-alert";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import DateRangeSelect, { type QuickRangeId } from "../date-range-select";
import DisplayRelativeDate from "../display-relative-date";
import GradientScrollArea from "../gradient-scroll-area";
import Icon from "../icons/icon";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Progress } from "../ui/progress";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "./components/dashboard-card";
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";

export default function InspectionAlertsOverview({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const { appState, setAppState } = useAppState();
  const [sorting, setSorting] = useAppStateValue("dash_alert_sort", [
    { id: "date", desc: true },
  ]);
  const [view, setView] = useAppStateValue("dash_alert_view", "summary");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const queryParams = useMemo(() => {
    return (
      appState.dash_alert_query ?? {
        createdOn: {
          gte: subDays(new Date(), 30).toISOString(),
          lte: new Date().toISOString(),
        },
      }
    );
  }, [appState.dash_alert_query]);

  const handleSetQueryParams = (
    newQueryParams: typeof queryParams,
    quickRangeId?: QuickRangeId<"past">
  ) => {
    setAppState({
      dash_alert_query: newQueryParams,
      dash_alert_quickRangeId: quickRangeId,
    });
  };

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          <ShieldAlert /> Recent Alerts
          <div className="flex-1"></div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(value) => {
              setView(value as "summary" | "details");
            }}
          >
            <ToggleGroupItem value="summary">
              <LayoutDashboard />
            </ToggleGroupItem>
            <ToggleGroupItem value="details">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
          {/* <Button variant="outline" size="iconSm">
            <Printer />
          </Button> */}
        </DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="min-h-0 flex-1 flex flex-col bg-inherit space-y-4 rounded-[inherit]">
        <div className="flex gap-2 flex-wrap items-center justify-between">
          <DateRangeSelect
            iconOnly
            value={
              queryParams.createdOn?.gte
                ? {
                    from: queryParams.createdOn?.gte,
                    to: queryParams.createdOn?.lte,
                  }
                : undefined
            }
            onValueChange={(dateRange, quickRangeId) => {
              if (!dateRange) {
                return;
              }

              const newQueryParams = dateRange
                ? {
                    ...queryParams,
                    createdOn: {
                      gte: dateRange.from,
                      lte: dateRange.to,
                    },
                  }
                : queryParams;
              handleSetQueryParams(newQueryParams, quickRangeId);
            }}
            defaultQuickRangeId={
              appState.dash_alert_quickRangeId ?? "last-30-days"
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(view === "summary" && "hidden")}
              >
                Sort by
                <ChevronsUpDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[
                {
                  id: "newestFirst",
                  sort: { id: "date", desc: true },
                  label: "Newest first",
                },
                {
                  id: "oldestFirst",
                  sort: { id: "date", desc: false },
                  label: "Oldest first",
                },
              ].map(({ id, sort, label }) => (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => {
                    setSorting([sort]);
                  }}
                >
                  <Check
                    className={cn(
                      "opacity-0",
                      sorting.some(
                        (s) => s.id === sort.id && s.desc === sort.desc
                      ) && "opacity-100"
                    )}
                  />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {view === "summary" ? (
          <AlertsSummary
            refreshKey={refreshKey}
            queryParams={queryParams}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        ) : (
          <AlertsDetails
            refreshKey={refreshKey}
            queryParams={queryParams}
            sorting={sorting}
            setSorting={setSorting}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        )}
      </DashboardCardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading alerts.</ErrorOverlay>
      ) : null}
    </DashboardCard>
  );
}

function AlertsSummary({
  refreshKey,
  queryParams,
  setIsLoading,
  setError,
}: {
  refreshKey: number;
  queryParams: QueryParams;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}) {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["inspection-alerts", queryParams] as const,
    queryFn: ({ queryKey }) => getInspectionAlerts(fetch, queryKey[1]),
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    setError(error);
  }, [error, setError]);

  const alerts = useMemo(() => data?.results ?? [], [data]);

  const unresolvedAlerts = useMemo(() => {
    return alerts.filter((alert) => !alert.resolved) ?? [];
  }, [alerts]);

  const resolvedAlerts = useMemo(() => {
    return alerts.filter((alert) => alert.resolved) ?? [];
  }, [alerts]);

  const unresolvedAlertsCounts = useMemo(() => {
    return AlertLevels.map((alertLevel) => {
      return {
        alertLevel,
        count: unresolvedAlerts.filter(
          (alert) => alert.alertLevel === alertLevel
        ).length,
      };
    });
  }, [unresolvedAlerts]);

  const percentResolved = useMemo(() => {
    return alerts.length < 1
      ? 0
      : (resolvedAlerts.length / alerts.length) * 100;
  }, [resolvedAlerts, unresolvedAlerts]);

  return (
    <GradientScrollArea className="flex-1" variant="card">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {[
            {
              label: "Unresolved",
              count: unresolvedAlerts.length,
              icon: AlertTriangle,
              coloring:
                "bg-urgent/10 dark:bg-urgent/20 border border-urgent/20 dark:border-urgent/30",
              iconColoring: "bg-urgent/20 text-urgent",
            },
            {
              label: "Resolved",
              count: resolvedAlerts.length,
              icon: ShieldCheck,
              coloring:
                "bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30",
              iconColoring: "bg-primary/20 text-primary",
            },
          ].map((options) => (
            <div
              key={options.label}
              className={cn(
                "flex items-center gap-2 justify-between rounded-lg p-2 sm:p-4 shadow-sm",
                options.coloring
              )}
            >
              <div>
                <h3 className="text-sm font-semibold">{options.label}</h3>
                <h1 className="text-xl xl:text-2xl font-bold">
                  {options.count}
                </h1>
              </div>
              <div
                className={cn("rounded-full p-2 xl:p-3", options.iconColoring)}
              >
                <options.icon className="size-5 xl:size-6" />
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Unresolved alert breakdown
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-x-3 md:gap-x-4 gap-y-3">
            {unresolvedAlertsCounts.map(({ alertLevel, count }, idx) => {
              const LevelIcon =
                alertLevel === "CRITICAL"
                  ? OctagonAlert
                  : alertLevel === "URGENT"
                  ? AlertCircle
                  : alertLevel === "WARNING"
                  ? AlertTriangle
                  : alertLevel === "INFO"
                  ? Info
                  : alertLevel === "AUDIT"
                  ? Activity
                  : AlertTriangle;
              return (
                <div
                  key={alertLevel}
                  className={cn(
                    "rounded-lg py-1 px-3 border flex items-center gap-3 shadow-sm",
                    {
                      "bg-critical-foreground/50 dark:bg-critical/20 border-critical/50 [&_svg]:text-critical":
                        alertLevel === "CRITICAL",
                      "bg-urgent-foreground/40 dark:bg-urgent/20 border-urgent/50 [&_svg]:text-urgent":
                        alertLevel === "URGENT",
                      "bg-warning/40 dark:bg-warning/20 border-warning-foreground/50 dark:border-warning/50 [&_svg]:text-warning-foreground dark:[&_svg]:text-warning":
                        alertLevel === "WARNING",
                      "bg-info/40 dark:bg-info/20 border-info-foreground/50 dark:border-info/50 [&_svg]:text-info-foreground dark:[&_svg]:text-info":
                        alertLevel === "INFO",
                      "bg-audit/40 dark:bg-audit/10 border-audit-foreground/50 dark:border-audit/50 [&_svg]:text-audit-foreground [&_svg]:dark:text-audit":
                        alertLevel === "AUDIT",
                    }
                  )}
                >
                  <LevelIcon className="size-5 shrink-0" />
                  <div className="flex flex-col items-center flex-1">
                    <h2 className="text-lg leading-tight font-bold">{count}</h2>
                    <h5 className="text-xs font-semibold">
                      {humanize(alertLevel)}
                    </h5>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t pt-2 space-y-2">
          <h5 className="flex items-center gap-2 text-sm font-semibold">
            Resolution progress
            <div className="flex-1"></div>
            <span className="text-sm text-muted-foreground">
              {percentResolved.toFixed(0)}%
            </span>
          </h5>
          <Progress value={percentResolved} />
          <div className="text-xs text-muted-foreground">
            {resolvedAlerts.length} resolved out of{" "}
            {resolvedAlerts.length + unresolvedAlerts.length} total alerts
          </div>
        </div>
      </div>
    </GradientScrollArea>
  );
}

function AlertsDetails({
  refreshKey,
  queryParams,
  sorting,
  setSorting,
  setIsLoading,
  setError,
}: {
  refreshKey: number;
  queryParams: QueryParams;
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}) {
  const { user } = useAuth();
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["inspection-alerts", queryParams] as const,
    queryFn: ({ queryKey }) => getInspectionAlerts(fetch, queryKey[1]),
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    setError(error);
  }, [error, setError]);

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
              className="inline-flex items-center gap-2 group"
            >
              <span className="group-hover:underline">{assetName}</span>
              {row.original.asset?.product?.productCategory?.icon && (
                <Icon
                  iconId={row.original.asset.product.productCategory.icon}
                  color={row.original.asset.product.productCategory.color}
                  className="text-lg"
                />
              )}
            </Link>
          );
        },
      },
      {
        accessorKey: "site.name",
        id: "site",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "alertLevel",
        id: "level",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue, row: { original: alert } }) => {
          const level = getValue() as Alert["alertLevel"];
          return (
            <AlertLevelBadge resolved={alert.resolved} alertLevel={level} />
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
            <Check className="size-5 text-status-compliant" />
          ) : (
            <>&mdash;</>
          ),
      },
      {
        id: "details",
        cell: ({ row }) => (
          <AssetInspectionAlert
            assetId={row.original.assetId}
            alertId={row.original.id}
            trigger={
              <button type="button" className="underline text-xs font-semibold">
                more
              </button>
            }
          />
        ),
      },
    ],
    []
  );

  const alerts = useMemo(() => data?.results ?? [], [data]);
  const table = useReactTable({
    data: alerts,
    columns,
    initialState: {
      columnVisibility: {
        site: hasMultiSiteVisibility(user),
      },
    },
    state: {
      sorting,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();
  const isEmpty = !rows.length;

  return (
    <GradientScrollArea className="flex-1" variant="card">
      {!isLoading && isEmpty ? (
        <p className="text-center text-sm text-muted-foreground py-4 border-t border-border">
          No alerts to display.
        </p>
      ) : null}
      {rows.map((row) => {
        const alert = row.original;
        const cells = row.getVisibleCells().reduce((acc, cell) => {
          acc[String(cell.column.id)] = cell;
          return acc;
        }, {} as Record<string, Cell<Alert, unknown>>);

        return (
          <div
            key={alert.id}
            className="py-2 flex flex-col gap-2 border-t border-border"
          >
            <div className="flex items-center gap-2 justify-between text-xs text-muted-foreground">
              {format(alert.createdOn, "PPpp")}
              <div className="flex items-center gap-1">
                {renderCell(cells.asset)}
                <span className="text-muted-foreground">•</span>
                {renderCell(cells.level)}
              </div>
            </div>
            <div>
              <p className="text-sm">
                {cells.site ? (
                  <span className="font-semibold">
                    [{renderCell(cells.site)}]
                  </span>
                ) : (
                  ""
                )}{" "}
                An alert was triggered {renderCell(cells.date)}.
              </p>
            </div>
            <div className="flex">{renderCell(cells.details)}</div>
          </div>
        );
      })}
    </GradientScrollArea>
  );
}

function AlertLevelBadge({
  resolved,
  alertLevel,
}: {
  resolved: boolean;
  alertLevel: Alert["alertLevel"];
}) {
  return (
    <span
      className={cn(
        "capitalize rounded-md px-2 py-1 text-xs font-semibold flex items-center gap-1 [&_svg]:size-3.5 [&_svg]:shrink-0",
        {
          "bg-critical text-critical-foreground":
            !resolved && alertLevel === "CRITICAL",
          "bg-urgent text-urgent-foreground":
            !resolved && alertLevel === "URGENT",
          "bg-warning text-warning-foreground":
            !resolved && alertLevel === "WARNING",
          "bg-info text-info-foreground": !resolved && alertLevel === "INFO",
          "bg-audit text-audit-foreground": !resolved && alertLevel === "AUDIT",
          "bg-muted text-muted-foreground": resolved,
        }
      )}
    >
      {!resolved && alertLevel === "CRITICAL" && <OctagonAlert />}
      {resolved && <Check className="text-primary" />}
      <span
        className={cn({
          "line-through": resolved,
        })}
      >
        {alertLevel.toLowerCase()}
      </span>
    </span>
  );
}

const getInspectionAlerts = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>,
  queryParams: QueryParams
) => {
  const qs = stringifyQuery({
    ...queryParams,
    limit: 10000,
  });
  const response = await fetch(`/alerts?${qs}`, {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<Alert>>;
};

const renderCell = (cell: Cell<Alert, unknown> | undefined | null) =>
  cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
