import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, Table } from "lucide-react";
import { useCallback, useMemo, type ReactNode } from "react";
import { useRevalidator, useSearchParams } from "react-router";
import { api } from "~/.server/api";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import VirtualizedTable from "~/components/data-table/virtualized-data-table";
import DateRangeSelect, {
  QUICK_DATE_RANGES,
  type QuickRangeId,
} from "~/components/date-range-select";
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
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { GetReportResult } from "~/lib/types";
import type { QueryParams } from "~/lib/urls";
import { buildTitleFromBreadcrumb, getSearchParams } from "~/lib/utils";
import type { Route } from "./+types/details";
import { downloadReportCsv } from "./utils";

export const handle = {
  breadcrumb: () => ({ label: "Details" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

const getDefaultDateRange = (quickRangeId: QuickRangeId<"both">) => {
  const quickRange =
    QUICK_DATE_RANGES.find((range) => range.id === quickRangeId) ??
    QUICK_DATE_RANGES[0];
  return {
    from: quickRange.value.from(),
    to: quickRange.value.to(),
  };
};

export const loader = ({ request, params }: Route.LoaderArgs) => {
  const requestQuery = getSearchParams(request);

  const dateRange = {
    from: requestQuery.get("dr_from"),
    to: requestQuery.get("dr_to"),
  };

  const defaultQuickRangeId =
    (requestQuery.get("qr_id") as QuickRangeId<"both"> | undefined) ?? null;
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

  return api.reports.get(request, params.id, query).mapTo((report) => ({
    report,
    defaultQuickRangeId,
    defaultDateRange,
  }));
};

export default function ReportDetails({
  loaderData: { report, defaultQuickRangeId, defaultDateRange },
}: Route.ComponentProps) {
  const { fetch } = useAuthenticatedFetch();

  const [searchParams, setSearchParams] = useSearchParams();
  const { revalidate } = useRevalidator();

  const { mutate: mutateExportCsv } = useMutation({
    mutationFn: (reportId: string) =>
      downloadReportCsv(fetch, reportId, {
        startDate: searchParams.get("dr_from") ?? defaultDateRange?.from,
        endDate: searchParams.get("dr_to") ?? defaultDateRange?.to,
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
            (searchParams.get("qr_id") as QuickRangeId) ?? defaultQuickRangeId
          }
          value={
            searchParams.has("dr_from")
              ? {
                  from: searchParams.get("dr_from")!,
                  to: searchParams.get("dr_to")!,
                }
              : undefined
          }
          onValueChange={(dateRange, quickRangeId) => {
            setSearchParams((draft) => {
              const handleSet = (
                key: string,
                value: string | null | undefined
              ) => {
                if (value) {
                  draft.set(key, value);
                } else {
                  draft.delete(key);
                }
              };
              handleSet("dr_from", dateRange?.from);
              handleSet("dr_to", dateRange?.to);
              handleSet("qr_id", quickRangeId);

              return draft;
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
  }, [report, searchParams, setSearchParams, defaultQuickRangeId, revalidate]);

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
