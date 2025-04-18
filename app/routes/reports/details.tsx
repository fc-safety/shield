import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, Table } from "lucide-react";
import { useCallback, useMemo } from "react";
import { api } from "~/.server/api";
import VirtualizedTable from "~/components/data-table/virtualized-data-table";
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
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/details";
import { downloadReportCsv } from "./utils";

export const handle = {
  breadcrumb: () => ({ label: "Details" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = ({ request, params }: Route.LoaderArgs) => {
  return api.reports.get(request, params.id).mapTo((report) => ({
    report,
  }));
};

export default function ReportDetails({
  loaderData: { report },
}: Route.ComponentProps) {
  const { fetch } = useAuthenticatedFetch();

  const { mutate: mutateExportCsv } = useMutation({
    mutationFn: (reportId: string) => downloadReportCsv(fetch, reportId),
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{report.name}</CardTitle>
          <CardDescription>{report.description}</CardDescription>
        </CardHeader>
        <CardContent className="bg-background">
          <VirtualizedTable
            height={"100%"}
            maxHeight={"70vh"}
            columns={columns}
            data={report.data}
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
