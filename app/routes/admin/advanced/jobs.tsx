import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { RotateCw, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import VirtualizedTable from "~/components/data-table/virtualized-data-table";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Job, JobQueue } from "~/lib/types";
import { buildTitleFromBreadcrumb, cn } from "~/lib/utils";
import type { Route } from "./+types/jobs";
export const handle = {
  breadcrumb: () => ({
    label: "Jobs",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async () => {
  return {};
};

export default function AdminAdvancedJobs() {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const queryClient = useQueryClient();
  const { data: jobQueues } = useQuery({
    queryKey: ["job-queues"],
    queryFn: () => getJobQueues(fetch),
    refetchInterval: 5000,
  });

  const {
    mutate: retryJob,
    isPending: isRetryJobPending,
    variables: retryJobVariables,
  } = useMutation({
    mutationFn: ({
      queueName,
      jobId,
    }: {
      queueName: string;
      jobId: string;
    }) => {
      return fetch(
        `/notifications/job-queues/${queueName}/retry-job/${jobId}`,
        {
          method: "POST",
        }
      );
    },
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["job-queues"] });
      toast.success(`Request to retry job ${jobId} was sent.`);
    },
  });

  const {
    mutate: removeJob,
    isPending: isRemoveJobPending,
    variables: removeJobVariables,
  } = useMutation({
    mutationFn: ({
      queueName,
      jobId,
    }: {
      queueName: string;
      jobId: string;
    }) => {
      return fetch(
        `/notifications/job-queues/${queueName}/remove-job/${jobId}`,
        {
          method: "POST",
        }
      );
    },
    onSuccess: (_data, { jobId, queueName }) => {
      queryClient.invalidateQueries({ queryKey: ["job-queues"] });
      toast.success(`Job ${jobId} was removed from queue ${queueName}.`);
    },
  });

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
          const isRetrying =
            isRetryJobPending &&
            retryJobVariables?.jobId === job.id &&
            retryJobVariables?.queueName === queueName;

          const isRemoving =
            isRemoveJobPending &&
            removeJobVariables?.jobId === job.id &&
            removeJobVariables?.queueName === queueName;

          return (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                title="Retry job"
                onClick={() => retryJob({ jobId: job.id, queueName })}
                disabled={isRetrying}
              >
                <RotateCw className={cn(isRetrying ? "animate-spin" : "")} />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                title="Remove job"
                onClick={() => removeJob({ jobId: job.id, queueName })}
                disabled={isRemoving}
                className={cn(isRemoving ? "animate-pulse" : "")}
              >
                <X />
              </Button>
            </div>
          );
        },
      },
    ],
    [
      commonJobColumns,
      retryJob,
      isRetryJobPending,
      retryJobVariables,
      removeJob,
      isRemoveJobPending,
      removeJobVariables,
    ]
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
      {jobQueues ? (
        jobQueues.map((jobQueue) => (
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
        ))
      ) : (
        <div className="rounded-lg w-full h-72 animate-pulse bg-card"></div>
      )}
    </div>
  );
}

const getJobQueues = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/notifications/job-queues", {
    method: "GET",
  });

  return response.json() as Promise<JobQueue[]>;
};
