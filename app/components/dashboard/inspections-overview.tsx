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
import { Check, ChevronsUpDown, SearchCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useImmer } from "use-immer";
import { useAppState } from "~/contexts/app-state-context";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Inspection, ResultsPage } from "~/lib/models";
import { stringifyQuery, type QueryParams } from "~/lib/urls";
import { getUserDisplayName, hasMultiSiteVisibility } from "~/lib/users";
import { cn } from "~/lib/utils";
import AssetInspectionDialog from "../assets/asset-inspection-dialog";
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
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";

export default function InspectionsOverview({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const { appState, setAppState } = useAppState();

  const { user } = useAuth();
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const [queryParams, setQueryParams] = useImmer(
    appState.dash_insp_query ?? {
      createdOn: {
        gte: subDays(new Date(), 30).toISOString(),
        lte: new Date().toISOString(),
      },
    }
  );

  const handleSetQueryParams = (
    newQueryParams: typeof queryParams,
    quickRangeId?: QuickRangeId
  ) => {
    setQueryParams(newQueryParams);
    setAppState({
      dash_insp_query: newQueryParams,
      dash_insp_quickRangeId: quickRangeId,
    });
  };

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["recent-inspections", queryParams] as const,
    queryFn: ({ queryKey }) => getRecentInspections(fetch, queryKey[1]),
  });

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

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
              className="inline-flex items-center gap-2 group"
            >
              <span className="group-hover:underline">{assetName}</span>
              {row.original.asset.product.productCategory.icon && (
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
        accessorFn: (inspection) =>
          inspection.inspector && getUserDisplayName(inspection.inspector),
        id: "inspector",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "comments",
        id: "comments",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() || <>&mdash;</>,
      },
      {
        id: "details",
        cell: ({ row }) => (
          <AssetInspectionDialog
            inspectionId={row.original.id}
            trigger={(isLoading, preloadInspection, setOpen) => (
              <button
                type="button"
                className={cn(
                  "underline text-xs font-semibold",
                  isLoading && "animate-pulse"
                )}
                onMouseEnter={() => preloadInspection(row.original.id)}
                onTouchStart={() => preloadInspection(row.original.id)}
                onClick={() => setOpen(true)}
              >
                more
              </button>
            )}
          />
        ),
      },
    ],
    []
  );

  const [sorting, setSorting] = useState<SortingState>(
    appState.dash_insp_sort ?? [{ id: "date", desc: true }]
  );

  const inspections = useMemo(() => data?.results ?? [], [data]);
  const table = useReactTable({
    data: inspections,
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
      dash_insp_sort: sorting,
    });
  };

  const { rows } = table.getRowModel();
  const isEmpty = !rows.length;

  return (
    <Card className="h-full relative">
      <CardHeader>
        <CardTitle>
          <SearchCheck /> Recent Inspections
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-64px)] flex flex-col bg-inherit space-y-4 rounded-[inherit]">
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
              appState.dash_insp_quickRangeId ?? "last-30-days"
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
        <GradientScrollArea className="flex-1" variant="card">
          {!isLoading && isEmpty ? (
            <p className="text-center text-sm text-muted-foreground py-4 border-t border-border">
              No inspections to display.
            </p>
          ) : null}
          {rows.map((row) => {
            const inspection = row.original;
            const cells = row.getVisibleCells().reduce((acc, cell) => {
              acc[String(cell.column.id)] = cell;
              return acc;
            }, {} as Record<string, Cell<Inspection, unknown>>);

            return (
              <div
                key={inspection.id}
                className="py-2 flex flex-col gap-2 border-t border-border"
              >
                <div className="flex items-center gap-2 justify-between text-xs text-muted-foreground">
                  {format(inspection.createdOn, "PPpp")}
                  {renderCell(cells.asset)}
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
                    {renderCell(cells.inspector)} inspected{" "}
                    {inspection.asset.name} {renderCell(cells.date)}.
                  </p>
                </div>
                <div className="flex">{renderCell(cells.details)}</div>
              </div>
            );
          })}
        </GradientScrollArea>
      </CardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading inspections.</ErrorOverlay>
      ) : null}
    </Card>
  );
}

const getRecentInspections = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>,
  queryParams: QueryParams
) => {
  const qs = stringifyQuery({
    ...queryParams,
    limit: 10000,
  });
  const response = await fetch(`/inspections?${qs}`, {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<Inspection>>;
};

const renderCell = (cell: Cell<Inspection, unknown> | undefined | null) =>
  cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
