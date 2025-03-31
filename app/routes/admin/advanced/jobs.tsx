import { api } from "~/.server/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Jobs</h1>
      {jobQueues.map((jobQueue) => (
        <Card key={jobQueue.queueName}>
          <CardHeader>
            <CardTitle>Queue name: {jobQueue.queueName}</CardTitle>
          </CardHeader>
          <CardContent>
            <h2>Failed jobs</h2>
            <pre>{JSON.stringify(jobQueue.failedJobs, null, 2)}</pre>
            <h2>Waiting jobs</h2>
            <pre>{JSON.stringify(jobQueue.waitingJobs, null, 2)}</pre>
            <h2>Active jobs</h2>
            <pre>{JSON.stringify(jobQueue.activeJobs, null, 2)}</pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
