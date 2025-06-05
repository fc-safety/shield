import {
  format,
  formatDistanceToNow,
  startOfDay,
  startOfWeek,
  subHours,
  subMinutes,
} from "date-fns";
import { Loader2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/user-sesssion";
import ConfirmationDialog from "~/components/confirmation-dialog";
import Icon from "~/components/icons/icon";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { getUserDisplayName } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/clear-demo-inspections";

export const handle = {
  breadcrumb: () => ({ label: "Clear Demo Inspections" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);
  const client = await api.clients
    .list(request, {
      limit: 1,
      externalId: user.clientId,
    })
    .then((client) => client.results.filter((c) => c.demoMode).at(0));

  if (!client) {
    throw new Response("No demo client found for current user.", {
      status: 404,
    });
  }

  const recentInspections = await api.inspections
    .list(request, {
      clientId: client.id,
      limit: 25,
      order: {
        createdOn: "desc",
      },
    })
    .then(({ results }) => results);

  return {
    client,
    recentInspections,
  };
};

export default function ClearDemoInspections({
  loaderData: { client, recentInspections },
}: Route.ComponentProps) {
  return (
    <Card className="w-full max-w-md self-center">
      <CardHeader>
        <CardTitle>
          <Badge variant="outline">Demo Only</Badge>
          Clear Inspections – {client.name}
        </CardTitle>
        <CardDescription>
          Clear inspections for the current demo client for one of the following
          time periods:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {QUICK_INTERVALS.map((interval) => (
            <DeleteInspectionsButton
              key={interval.label}
              clientId={client.id}
              label={interval.label}
              startDate={interval.startDate}
              endDate={interval.endDate}
            />
          ))}
        </div>

        <h3 className="text-lg font-semibold mt-4 mb-2">Recent Inspections</h3>
        <div className="flex flex-col gap-2">
          {recentInspections.map((inspection) => (
            <div
              key={inspection.id}
              className="py-2 flex flex-col gap-2 border-t border-border"
            >
              <div className="flex items-center gap-2 justify-between text-xs text-muted-foreground">
                {format(inspection.createdOn, "PPpp")}
                <Link
                  to={inspection.asset ? `/assets/${inspection.asset.id}` : "#"}
                  className="inline-flex items-center gap-2 group"
                >
                  <span className="group-hover:underline">
                    {inspection.asset.name}
                  </span>
                  {inspection.asset.product.productCategory.icon && (
                    <Icon
                      iconId={inspection.asset.product.productCategory.icon}
                      color={inspection.asset.product.productCategory.color}
                      className="text-lg"
                    />
                  )}
                </Link>
              </div>
              <div>
                <p className="text-sm">
                  {inspection.site ? (
                    <span className="font-semibold">
                      [{inspection.site.name}]
                    </span>
                  ) : (
                    ""
                  )}{" "}
                  {inspection.inspector
                    ? getUserDisplayName(inspection.inspector)
                    : "Unknown Inspector"}{" "}
                  inspected {inspection.asset.name}{" "}
                  {formatDistanceToNow(inspection.createdOn, {
                    addSuffix: true,
                  })}
                  .
                </p>
              </div>
            </div>
          ))}
          {recentInspections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No recent inspections found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteInspectionsButton({
  clientId,
  label,
  startDate,
  endDate,
}: QuickInterval & { clientId: string }) {
  const { submitJson, isSubmitting } = useModalFetcher({
    onSubmitted: () => {
      toast.success("Inspections cleared successfully.");
    },
  });
  const [confirm, setConfirm] = useConfirmAction({
    defaultProps: {
      destructive: true,
    },
  });

  const handleClear = async () => {
    setConfirm((d) => {
      d.open = true;
      d.title = `Demo Inspections – ${label}`;
      d.message =
        "Are you sure you want to clear all inspections for the current demo client for this time period?";
      d.onConfirm = () => {
        submitJson(
          { startDate, endDate: endDate ?? null, clientId },
          {
            path: "/api/proxy/clients/clear-demo-inspections",
            method: "POST",
          }
        );
      };
    });
  };

  return (
    <div>
      <Button
        variant="destructive"
        onClick={() => handleClear()}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : label}
      </Button>
      <ConfirmationDialog {...confirm} />
    </div>
  );
}

interface QuickInterval {
  label: string;
  startDate: string;
  endDate?: string;
}

const QUICK_INTERVALS: QuickInterval[] = [
  {
    label: "Clear Last 5 Minutes",
    startDate: subMinutes(new Date(), 5).toISOString(),
  },
  {
    label: "Clear Last Hour",
    startDate: subHours(new Date(), 1).toISOString(),
  },
  {
    label: "Clear Today",
    startDate: startOfDay(new Date()).toISOString(),
  },
  {
    label: "Clear This Week",
    startDate: startOfWeek(new Date()).toISOString(),
  },
];
