import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format, subDays } from "date-fns";
import {
  Check,
  ChevronsUpDown,
  CornerDownRight,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useImmer } from "use-immer";
import { useAppState } from "~/contexts/app-state-context";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Alert, ResultsPage } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { stringifyQuery } from "~/lib/urls";
import { hasMultiSiteVisibility } from "~/lib/users";
import { cn } from "~/lib/utils";
import AssetInspectionAlert from "../assets/asset-inspection-alert";
import DataList from "../data-list";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import DateRangeSelect, { type QuickRangeId } from "../date-range-select";
import DisplayRelativeDate from "../display-relative-date";
import GradientScrollArea from "../gradient-scroll-area";
import Icon from "../icons/icon";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import ErrorDashboardTile from "./error-dashboard-tile";

export default function InspectionAlertsOverview() {
  const { appState, setAppState } = useAppState();

  const { user } = useAuth();
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const [queryParams, setQueryParams] = useImmer(
    appState.dash_alert_query ?? {
      createdOn: {
        gte: subDays(new Date(), 30).toISOString(),
        lte: new Date().toISOString(),
      },
    }
  );

  const handleSetQueryParams = (
    newQueryParams: typeof queryParams,
    quickRangeId?: QuickRangeId<"past">
  ) => {
    setQueryParams(newQueryParams);
    setAppState({
      dash_alert_query: newQueryParams,
      dash_alert_quickRangeId: quickRangeId,
    });
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ["inspection-alerts", queryParams] as const,
    queryFn: ({ queryKey }) => getInspectionAlerts(fetch, queryKey[1]),
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
          const level = getValue() as string;
          return (
            <span
              className={cn(
                "capitalize rounded-md px-2 py-0.5 text-xs font-semibold",
                {
                  "bg-urgent text-urgent-foreground":
                    !alert.resolved && level === "URGENT",
                  "bg-important text-important-foreground":
                    !alert.resolved && level === "INFO",
                  "bg-muted text-muted-foreground": alert.resolved,
                }
              )}
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

  const [sorting, setSorting] = useState<SortingState>(
    appState.dash_alert_sort ?? [{ id: "date", desc: true }]
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

  const handleSortingChange = (sorting: SortingState) => {
    table.setSorting(sorting);
    setAppState({
      dash_alert_sort: sorting,
    });
  };

  const { rows } = table.getRowModel();
  const isEmpty = !rows.length;

  return error ? (
    <ErrorDashboardTile />
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>
          <ShieldAlert /> Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-inherit space-y-4 rounded-[inherit]">
        <div className="flex gap-2 flex-wrap items-center justify-between">
          <DateRangeSelect
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
              <Button variant="outline" size="sm">
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
                    handleSortingChange([sort]);
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
        <GradientScrollArea className="h-[350px]" variant="card">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : isEmpty ? (
            <p className="text-center text-sm text-muted-foreground py-4 border-t border-border">
              No alerts to display.
            </p>
          ) : null}
          {rows.map((row) => {
            const inspection = row.original;
            const cells = row.getVisibleCells().reduce((acc, cell) => {
              acc[String(cell.column.id)] = cell;
              return acc;
            }, {} as Record<string, Cell<Alert, unknown>>);

            return (
              <div
                key={inspection.id}
                className="py-2 flex flex-col gap-2 border-t border-border"
              >
                <div className="flex items-center gap-2 justify-between text-xs text-muted-foreground">
                  {renderCell(cells.date)}
                </div>
                <div>
                  <DataList
                    details={[
                      {
                        label: "Date",
                        value: format(inspection.createdOn, "PPpp"),
                        hidden: !cells.date,
                      },
                      {
                        label: "Site",
                        value: renderCell(cells.site),
                        hidden: !cells.site,
                      },
                      {
                        label: "Level",
                        value: renderCell(cells.level),
                        hidden: !cells.level,
                      },
                      {
                        label: "Resolved",
                        value: renderCell(cells.resolved),
                        hidden: !cells.resolved,
                      },
                    ]}
                    defaultValue={<>&mdash;</>}
                    fluid
                    classNames={{
                      details: "gap-0.5",
                    }}
                  />
                </div>
                <div className="flex">{renderCell(cells.details)}</div>
              </div>
            );
          })}
        </GradientScrollArea>
      </CardContent>
    </Card>
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
