import { useMutation } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  CornerDownRight,
  FileSpreadsheet,
  Table,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import DateRangeSelect from "~/components/date-range-select";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAppStateValue } from "~/contexts/app-state-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type {
  DateRangeSupport,
  ListReportsResult,
  ReportType,
} from "~/lib/types";
import type { Route } from "./+types/index";
import type { QuickRangeIdFromDateRangeSupport } from "./types";
import { downloadReportCsv } from "./utils";
import { getDefaultDateRange, getDefaultQuickRangeId } from "./utils/core";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.reports.list(request).then((reports) => ({
    reports,
  }));
};

export default function ReportsIndex({
  loaderData: { reports },
}: Route.ComponentProps) {
  const { fetch } = useAuthenticatedFetch();

  const [reportDateRanges, setReportDateRanges] = useAppStateValue(
    "reports_dateRanges",
    {}
  );

  useEffect(() => {
    if (reports.every((report) => reportDateRanges[report.id])) {
      return;
    }

    const newDateRanges = { ...reportDateRanges };
    for (const report of reports) {
      if (reportDateRanges[report.id]) {
        continue;
      }

      const defaultQuickRangeId = getDefaultQuickRangeId(
        report.dateRangeSupport
      );
      newDateRanges[report.id] = {
        ...getDefaultDateRange(getDefaultQuickRangeId(report.dateRangeSupport)),
        quickRangeId: defaultQuickRangeId,
      };
    }

    setReportDateRanges(newDateRanges);
  }, [reports, reportDateRanges, setReportDateRanges]);

  const getReportQuery = useCallback(
    (reportId: string, dateRangeSupport: DateRangeSupport) => {
      const defaultDateRange = getDefaultDateRange(
        getDefaultQuickRangeId(dateRangeSupport)
      );
      return {
        startDate: reportDateRanges[reportId]?.from ?? defaultDateRange.from,
        endDate: reportDateRanges[reportId]?.to ?? defaultDateRange.to,
      };
    },
    [reportDateRanges]
  );

  const { mutate: mutateExportCsv } = useMutation({
    mutationFn: (report: ListReportsResult) =>
      downloadReportCsv(
        fetch,
        report.id,
        getReportQuery(report.id, report.dateRangeSupport)
      ),
  });

  const handleExportCsv = useCallback(
    (report: ListReportsResult) => {
      mutateExportCsv(report);
    },
    [mutateExportCsv]
  );

  const columns = useMemo(
    (): ColumnDef<ListReportsResult>[] => [
      {
        accessorKey: "name",
        cell: ({ getValue, row }) => (
          <Link to={`/reports/${row.original.id}`} className="hover:underline">
            {getValue() as string}
          </Link>
        ),
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "description",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "type",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const type = getValue() as ReportType;
          return (
            <Badge variant="outline" className="capitalize">
              {type.toLowerCase()}
            </Badge>
          );
        },
      },
      {
        id: "dateRange",
        enableSorting: false,
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row }) => {
          const report = row.original;

          if (report.dateRangeSupport === "NONE") {
            return <>&mdash;</>;
          }

          const { quickRangeId, ...dateRange } =
            reportDateRanges[report.id] ??
            getDefaultDateRange(
              getDefaultQuickRangeId(report.dateRangeSupport)
            );
          return (
            <DateRangeSelect
              value={dateRange}
              onValueChange={(newDateRange, quickRangeId) => {
                if (!newDateRange) {
                  return;
                }

                setReportDateRanges((draft) => ({
                  ...draft,
                  [report.id]: {
                    from: newDateRange.from,
                    to: newDateRange.to ?? dateRange.to,
                    quickRangeId:
                      quickRangeId as QuickRangeIdFromDateRangeSupport<
                        typeof report.dateRangeSupport
                      >,
                  },
                }));
              }}
              defaultQuickRangeId={quickRangeId}
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
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const report = row.original;

          const dateRangeValues = reportDateRanges[report.id];
          const query = new URLSearchParams();
          if (dateRangeValues) {
            query.set("dr_from", dateRangeValues.from);
            query.set("dr_to", dateRangeValues.to);
            if (dateRangeValues.quickRangeId) {
              query.set("qr_id", dateRangeValues.quickRangeId);
            }
          }

          return (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link to={`/reports/${report.id}?${query.toString()}`}>
                  <CornerDownRight />
                  View
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    Export
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleExportCsv(report)}>
                    <Table />
                    CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [handleExportCsv, reportDateRanges, setReportDateRanges]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <FileSpreadsheet /> Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={reports}
            searchPlaceholder="Search reports..."
            initialState={{
              sorting: [
                {
                  id: "name",
                  desc: false,
                },
              ],
            }}
            actions={() => [
              // <Button key="add" size="sm" asChild>
              //   <Link to="/reports/build">
              //     <FilePlus />
              //     Build Report
              //   </Link>
              // </Button>,
              // <DropdownMenu key="bulk-actions">
              //   <DropdownMenuTrigger asChild>
              //     <Button
              //       variant="outline"
              //       size="sm"
              //       disabled={!table.getIsSomeRowsSelected()}
              //     >
              //       Actions ({table.getSelectedRowModel().rows.length})
              //       <ChevronDown className="h-4 w-4" />
              //     </Button>
              //   </DropdownMenuTrigger>
              //   <DropdownMenuContent align="end">
              //     <DropdownMenuItem>
              //       <Trash />
              //       Delete Selected
              //     </DropdownMenuItem>
              //   </DropdownMenuContent>
              // </DropdownMenu>,
            ]}
          />
        </CardContent>
      </Card>
    </>
  );
}
