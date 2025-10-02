import {
  endOfDay,
  format,
  formatDistanceToNow,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subHours,
  subMinutes,
} from "date-fns";
import { Loader2, Nfc } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "~/.server/api";
import { getAuthenticatedFetcher } from "~/.server/api-utils";
import { requireUserSession } from "~/.server/user-sesssion";
import ConfirmationDialog from "~/components/confirmation-dialog";
import Icon from "~/components/icons/icon";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { getMyOrganizationFn } from "~/lib/services/clients.service";
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
  await requireUserSession(request);

  const fetcher = getAuthenticatedFetcher(request);
  const { client } = await getMyOrganizationFn(fetcher)();

  if (!client || !client.demoMode) {
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
      include: {
        asset: {
          include: {
            tag: true,
          },
        },
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
          Clear inspections for the current demo client for one of the following time periods:
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
          <ClearInspectionsByDateRangeButton clientId={client.id} />
        </div>

        <h3 className="mt-4 mb-2 text-lg font-semibold">Recent Inspections</h3>
        <div className="flex flex-col gap-2">
          {recentInspections.map((inspection) => (
            <div key={inspection.id} className="border-border flex flex-col gap-2 border-t py-2">
              <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                <div className="flex shrink-0 items-center gap-1">
                  <div className="border-border text-foreground inline-flex items-center gap-1 rounded-sm border px-1 py-0.5 text-xs font-semibold">
                    <Nfc className="size-3" />
                    {inspection.asset.tag?.serialNumber || <>&mdash;</>}
                  </div>
                  <div>&bull;</div>

                  <Link
                    to={inspection.asset ? `/assets/${inspection.asset.id}` : "#"}
                    className="group inline-flex items-center gap-2"
                  >
                    <span className="group-hover:underline">{inspection.asset.name}</span>
                    {inspection.asset.product.productCategory.icon && (
                      <Icon
                        iconId={inspection.asset.product.productCategory.icon}
                        color={inspection.asset.product.productCategory.color}
                        className="text-lg"
                      />
                    )}
                  </Link>
                </div>
                {format(inspection.createdOn, "PPpp")}
              </div>
              <div>
                <p className="text-sm">
                  {inspection.site ? (
                    <span className="font-semibold">[{inspection.site.name}]</span>
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
            <p className="text-muted-foreground text-sm">No recent inspections found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const useDeleteInspectionsButton = ({
  clientId,
  label,
  startDate,
  endDate,
  onSuccess,
}: QuickInterval & { clientId: string; onSuccess?: () => void }) => {
  const { submitJson, isSubmitting } = useModalFetcher({
    onSubmitted: () => {
      toast.success("Inspections cleared successfully.");
      onSuccess?.();
    },
  });
  const [confirm, setConfirm] = useConfirmAction({
    defaultProps: {
      destructive: true,
    },
  });

  const handleConfirm = useCallback(() => {
    submitJson(
      { startDate, endDate: endDate ?? null, clientId },
      {
        path: "/api/proxy/clients/clear-demo-inspections",
        method: "POST",
      }
    );
  }, [submitJson, clientId, startDate, endDate]);

  const durationMessage = useMemo(() => {
    const formatStr = "PPP @ p";
    const bold = (str: string) => <span className="font-semibold">{str}</span>;
    if (!endDate || isSameDay(endDate, new Date())) {
      return <>since {bold(format(startDate, formatStr))}</>;
    }

    return (
      <>
        from {bold(format(startDate, formatStr))} to {bold(format(endDate, formatStr))}
      </>
    );
  }, [startDate, endDate]);

  const handleClear = useCallback(async () => {
    setConfirm((d) => {
      d.open = true;
      d.title = `Demo Inspections – ${label}`;
      d.message = (
        <>
          Are you sure you want to clear all inspections for the current demo client{" "}
          {durationMessage}?
        </>
      );
      d.onConfirm = handleConfirm;
    });
  }, [submitJson, label, clientId, startDate, endDate]);

  const DeleteButton = useCallback(
    () => (
      <Button
        type="button"
        variant="destructive"
        onClick={() => handleClear()}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : label}
      </Button>
    ),
    [isSubmitting, label, handleClear]
  );

  const ConfirmDeleteDialog = useCallback(
    () => <ConfirmationDialog {...confirm} />,
    [confirm.open, confirm.title, confirm.message, confirm.onConfirm]
  );

  return {
    handleClear,
    isSubmitting,
    DeleteButton,
    ConfirmDeleteDialog,
  };
};

function DeleteInspectionsButton({
  clientId,
  label,
  startDate,
  endDate,
}: QuickInterval & { clientId: string }) {
  const { DeleteButton, ConfirmDeleteDialog } = useDeleteInspectionsButton({
    clientId,
    label,
    startDate,
    endDate,
  });
  return (
    <div>
      <DeleteButton />
      <ConfirmDeleteDialog />
    </div>
  );
}

function ClearInspectionsByDateRangeButton({ clientId }: { clientId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm({
    values: {
      startDate: startOfDay(new Date()).toISOString(),
      endDate: endOfDay(new Date()).toISOString(),
    },
  });

  const { DeleteButton, ConfirmDeleteDialog } = useDeleteInspectionsButton({
    clientId,
    label: "Clear",
    startDate: form.watch("startDate"),
    endDate: form.watch("endDate"),
    onSuccess: () => setDialogOpen(false),
  });

  return (
    <>
      <ResponsiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trigger={
          <Button type="button" variant="outline">
            Clear Custom
          </Button>
        }
        title="Clear Inspections By Date Range"
        dialogClassName="sm:max-w-lg"
      >
        <Form {...form}>
          <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={value ? format(parseISO(value), "yyyy-MM-dd") : undefined}
                      onChange={(e) => {
                        const value = e.target.value;
                        onChange(startOfDay(parseISO(value)).toISOString());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={value ? format(parseISO(value), "yyyy-MM-dd") : undefined}
                      onChange={(e) => {
                        const value = e.target.value;
                        onChange(endOfDay(parseISO(value)).toISOString());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DeleteButton />
          </form>
        </Form>
      </ResponsiveDialog>
      <ConfirmDeleteDialog />
    </>
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
  {
    label: "Clear This Month",
    startDate: startOfMonth(new Date()).toISOString(),
  },
];
