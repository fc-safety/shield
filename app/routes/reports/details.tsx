import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, Table } from "lucide-react";
import { useCallback, useMemo, type ReactNode } from "react";
import { useRevalidator } from "react-router";
import { api } from "~/.server/api";
import { getAppState } from "~/.server/sessions";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import VirtualizedTable from "~/components/data-table/virtualized-data-table";
import DateRangeSelect from "~/components/date-range-select";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAppStateValue } from "~/contexts/app-state-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { GetReportResult } from "~/lib/types";
import type { QueryParams } from "~/lib/urls";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/details";
import { downloadReportCsv } from "./utils";
import { getDefaultDateRange } from "./utils/core";

export const handle = {
  breadcrumb: () => ({ label: "Details" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { id: reportId } = params;

  const { reports_dateRanges } = await getAppState(request);
  const { from, to, quickRangeId } = reports_dateRanges?.[reportId] ?? {};
  const dateRange = { from, to };

  const defaultQuickRangeId = quickRangeId ?? null;
  let defaultDateRange: {
    from: string;
    to: string;
  } | null = null;

  const query: QueryParams = {};
  if (dateRange.from) {
    query.startDate = dateRange.from;

    if (dateRange.to) {
      query.endDate = dateRange.to;
    }
  } else if (defaultQuickRangeId) {
    defaultDateRange = getDefaultDateRange(defaultQuickRangeId);
    query.startDate = defaultDateRange.from;
    query.endDate = defaultDateRange.to;
  }

  const report = await api.reports.get(request, reportId, query);

  return {
    report,
    defaultQuickRangeId,
    defaultDateRange,
  };
};

export default function ReportDetails({
  loaderData: { report, defaultQuickRangeId, defaultDateRange },
}: Route.ComponentProps) {
  const { fetch } = useAuthenticatedFetch();
  const { revalidate } = useRevalidator();

  const [reportDateRanges, setReportDateRanges] = useAppStateValue(
    "reports_dateRanges",
    {}
  );
  const reportDateRange = reportDateRanges[report.id];

  const { mutate: mutateExportCsv } = useMutation({
    mutationFn: (reportId: string) =>
      downloadReportCsv(fetch, reportId, {
        startDate: reportDateRange?.from ?? defaultDateRange?.from,
        endDate: reportDateRange?.to ?? defaultDateRange?.to,
      }),
  });

  const handleExportCsv = useCallback(
    (report: GetReportResult) => {
      mutateExportCsv(report.id);
    },
    [mutateExportCsv]
  );

  const columns = useMemo(() => {
    return report.columns.map(
      (column) =>
        ({
          accessorKey: column,
          header: ({ column: tableColumn, table }) => (
            <DataTableColumnHeader
              column={tableColumn}
              table={table}
              title={column}
              allowWrap
            />
          ),
          cell: ({ getValue }) => (
            <span
              className="overflow-hidden text-ellipsis"
              title={getValue() as string}
            >
              {(getValue() as string) || <>&mdash;</>}
            </span>
          ),
        } satisfies ColumnDef<(typeof report.data)[number]>)
    );
  }, [report]);

  const externalFilters = useMemo(() => {
    const filters: ReactNode[] = [];

    if (report.dateRangeSupport !== "NONE") {
      filters.push(
        <DateRangeSelect
          key="date-range-select"
          defaultQuickRangeId={
            reportDateRange?.quickRangeId ?? defaultQuickRangeId ?? undefined
          }
          value={
            reportDateRange
              ? {
                  from: reportDateRange.from,
                  to: reportDateRange.to,
                }
              : undefined
          }
          onValueChange={(dateRange, quickRangeId) => {
            setReportDateRanges((draft) => {
              if (dateRange) {
                return {
                  ...draft,
                  [report.id]: {
                    ...draft[report.id],
                    from: dateRange.from,
                    to: dateRange.to ?? "",
                    quickRangeId,
                  },
                };
              } else {
                return Object.fromEntries(
                  Object.entries(draft).filter(([key]) => key !== report.id)
                ) as typeof draft;
              }
            });
            revalidate();
          }}
          past={
            report.dateRangeSupport === "PAST" ||
            report.dateRangeSupport === "BOTH"
          }
          future={
            report.dateRangeSupport === "FUTURE" ||
            report.dateRangeSupport === "BOTH"
          }
        />
      );
    }
    return filters;
  }, [
    report,
    reportDateRange,
    setReportDateRanges,
    defaultQuickRangeId,
    revalidate,
  ]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{report.name}</CardTitle>
          <CardDescription>{report.description}</CardDescription>
        </CardHeader>
        <CardContent className="bg-[inherit]">
          <VirtualizedTable
            height={"100%"}
            maxHeight={"70vh"}
            columns={columns}
            data={report.data}
            externalFilters={externalFilters}
            actions={[
              <DropdownMenu key="export-menu">
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm">
                    Export <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => handleExportCsv(report)}>
                    <Table />
                    Export to CSV
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>
                    <File />
                    Export to PDF
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>,
            ]}
          />
        </CardContent>
      </Card>
    </>
  );
}
