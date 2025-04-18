import { useMutation } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRight,
  FileSpreadsheet,
  MoreHorizontal,
  Table,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { ListReportsResult, ReportType } from "~/lib/types";
import type { Route } from "./+types/index";
import { downloadReportCsv } from "./utils";

export const loader = ({ request }: Route.LoaderArgs) => {
  return api.reports.list(request).mapTo((reports) => ({
    reports,
  }));
};

export default function ReportsIndex({
  loaderData: { reports },
}: Route.ComponentProps) {
  const { fetch } = useAuthenticatedFetch();

  const { mutate: mutateExportCsv } = useMutation({
    mutationFn: (reportId: string) => downloadReportCsv(fetch, reportId),
  });

  const handleExportCsv = useCallback(
    (report: ListReportsResult) => {
      mutateExportCsv(report.id);
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
        id: "actions",
        cell: ({ row }) => {
          const report = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                <DropdownMenuItem asChild>
                  <Link to={`/reports/${report.id}`}>
                    <CornerDownRight />
                    Details
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem asChild>
                <Link to={`/reports/build/${asset.id}`}>
                  <Pencil />
                  Edit
                </Link>
              </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleExportCsv(report)}>
                  <Table />
                  Export (.csv)
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <File />
                  Export (.pdf)
                </DropdownMenuItem> */}
                {/* <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Printer />
                  Print
                </DropdownMenuItem> */}
                {/* <DropdownMenuItem>
                <Trash />
                Delete
              </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleExportCsv]
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
                  id: "createdAt",
                  desc: true,
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
