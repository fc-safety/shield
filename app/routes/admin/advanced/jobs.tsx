import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { RotateCcw, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { api } from "~/.server/api";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import VirtualizedTable from "~/components/data-table/virtualized-data-table";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Job } from "~/lib/types";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/jobs";
export const handle = {
  breadcrumb: () => ({
    label: "Jobs",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.notifications.getJobQueues(request);
};

export default function AdminAdvancedJobs({
  loaderData: jobQueues,
}: Route.ComponentProps) {
  const { submitJson: submitRetryJob } = useModalFetcher();
  const handleRetryJob = useCallback(
    (jobId: string, queueName: string) => {
      submitRetryJob(
        {},
        {
          path: "/api/proxy/notifications/job-queues/:queueName/retry-job/:jobId",
          query: {
            queueName,
            jobId,
          },
        }
      );
    },
    [submitRetryJob]
  );

  const { submitJson: submitRemoveJob } = useModalFetcher();
  const handleRemoveJob = useCallback(
    (jobId: string, queueName: string) => {
      submitRemoveJob(
        {},
        {
          path: "/api/proxy/notifications/job-queues/:queueName/remove-job/:jobId",
          query: {
            queueName,
            jobId,
          },
        }
      );
    },
    [submitRemoveJob]
  );

  const commonJobColumns = useMemo(
    (): ColumnDef<Job<unknown>>[] => [
      {
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} title="ID" />
        ),
        accessorKey: "id",
      },
      {
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        accessorKey: "name",
      },
      {
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        accessorKey: "timestamp",
        cell: ({ getValue }) => format(getValue() as number, "PPpp"),
      },
      {
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        accessorKey: "data",
        cell: ({ getValue }) => {
          const data = getValue() as Record<string, unknown>;
          return (
            <ResponsiveDialog
              title="Data"
              trigger={<Button variant="secondary">View data</Button>}
            >
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            </ResponsiveDialog>
          );
        },
      },
    ],
    []
  );

  const failedJobColumns = useCallback(
    (queueName: string): ColumnDef<Job<unknown>>[] => [
      ...commonJobColumns,
      {
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        accessorKey: "failedReason",
      },
      {
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        accessorKey: "stacktrace",
        cell: ({ getValue }) => {
          const stacktrace = getValue() as string[];
          return (
            <ResponsiveDialog
              title="Stacktrace"
              trigger={<Button variant="secondary">View stacktrace</Button>}
            >
              <pre className="text-xs whitespace-pre-wrap">
                {stacktrace.join("\n")}
              </pre>
            </ResponsiveDialog>
          );
        },
      },
      {
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        accessorKey: "attemptsMade",
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                title="Retry job"
                onClick={() => handleRetryJob(job.id, queueName)}
              >
                <RotateCcw />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                title="Remove job"
                onClick={() => handleRemoveJob(job.id, queueName)}
              >
                <X />
              </Button>
            </div>
          );
        },
      },
    ],
    [commonJobColumns, handleRetryJob, handleRemoveJob]
  );

  const waitingJobColumns = useMemo(
    (): ColumnDef<Job<unknown>>[] => [...commonJobColumns],
    [commonJobColumns]
  );

  const activeJobColumns = useMemo(
    (): ColumnDef<Job<unknown>>[] => [...commonJobColumns],
    [commonJobColumns]
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Jobs</h1>
      {jobQueues.map((jobQueue) => (
        <Card key={jobQueue.queueName}>
          <CardHeader>
            <CardTitle>Queue name: {jobQueue.queueName}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 bg-inherit">
            <h2>Failed jobs</h2>
            <VirtualizedTable
              height={"100%"}
              maxHeight={500}
              columns={failedJobColumns(jobQueue.queueName)}
              data={jobQueue.failedJobs}
            />
            <h2>Waiting jobs</h2>
            <VirtualizedTable
              height={"100%"}
              maxHeight={500}
              columns={waitingJobColumns}
              data={jobQueue.waitingJobs}
            />
            <h2>Active jobs</h2>
            <VirtualizedTable
              height={"100%"}
              maxHeight={500}
              columns={activeJobColumns}
              data={jobQueue.activeJobs}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
