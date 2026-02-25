import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Image, Loader2, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Alert } from "~/lib/models";
import { resolveAlertSchema } from "~/lib/schema";
import { CAPABILITIES } from "~/lib/permissions";
import { can } from "~/lib/users";
import { isNil } from "~/lib/utils";
import HydrationSafeFormattedDate from "../common/hydration-safe-formatted-date";
import DataList from "../data-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import DisplayInspectionValue from "./display-inspection-value";

interface AssetInspectionAlertProps {
  assetId: string;
  alertId: string;
  trigger: React.ReactNode;
}

export default function AssetInspectionAlert({
  assetId,
  alertId,
  trigger,
}: AssetInspectionAlertProps) {
  const [alert, setAlert] = useState<Alert | undefined>();
  const { load, isLoading } = useModalFetcher<DataOrError<Alert>>({
    onData: (data) => setAlert(data.data),
  });

  const handlePreloadAlerts = useCallback(() => {
    if (alert === undefined) {
      load({
        path: `/api/proxy/alerts/${alertId}?assetId=${assetId}`,
      });
    }
  }, [alert, assetId, alertId, load]);

  return (
    <ResponsiveDialog
      title="Inspection Alert"
      trigger={
        <div onMouseEnter={handlePreloadAlerts} onTouchStart={handlePreloadAlerts}>
          {trigger}
        </div>
      }
      dialogClassName="sm:max-w-lg"
    >
      {alert ? (
        <InspectionAlert alert={alert} loading={isLoading} />
      ) : (
        <Skeleton className="h-64 w-full rounded" />
      )}
    </ResponsiveDialog>
  );
}

type TForm = z.infer<typeof resolveAlertSchema>;

function InspectionAlert({ alert, loading = false }: { alert: Alert; loading?: boolean }) {
  const { user } = useAuth();
  const canResolve = can(user, CAPABILITIES.RESOLVE_ALERTS);

  const { submitJson: submit, isSubmitting } = useModalFetcher();

  const form = useForm<TForm>({
    resolver: zodResolver(resolveAlertSchema),
    defaultValues: {
      resolutionNote: alert.resolutionNote || "",
    },
  });

  const {
    formState: { isValid },
  } = form;

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/alerts/${alert.id}/resolve`,
    });
  };

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-2">
        {alert.resolved ? (
          <ShieldCheck className="text-primary size-10" />
        ) : alert.alertLevel === "CRITICAL" ? (
          <ShieldX className="fill-critical text-critical-foreground size-10" />
        ) : alert.alertLevel === "URGENT" ? (
          <ShieldX className="fill-urgent text-urgent-foreground size-10" />
        ) : alert.alertLevel === "WARNING" ? (
          <ShieldAlert className="fill-warning text-warning-foreground size-10" />
        ) : alert.alertLevel === "INFO" ? (
          <ShieldAlert className="fill-info text-info-foreground size-10" />
        ) : (
          <ShieldAlert className="fill-audit text-audit-foreground size-10" />
        )}
        <div>
          <p className="text-muted-foreground text-xs">
            <HydrationSafeFormattedDate date={alert.createdOn} formatStr="PPpp" />
          </p>
          <h3 className="text-base font-semibold uppercase">
            {alert.resolved ? "Resolved" : alert.alertLevel}
          </h3>
        </div>
      </div>
      <DataList
        title="Details"
        details={[
          {
            label: "Level",
            value: <span className="capitalize">{alert.alertLevel.toLowerCase()}</span>,
          },
          {
            label: "Reason",
            value: alert.message.replace(/^./, (c) => c.toUpperCase()),
          },
          {
            label: "Question",
            value: alert.assetQuestionResponse?.originalPrompt,
          },
          {
            label: "Answer",
            value: !isNil(alert.assetQuestionResponse?.value) && (
              <DisplayInspectionValue value={alert.assetQuestionResponse?.value} />
            ),
          },
          {
            label: "Inspection Image",
            value: alert.inspectionImageUrl && <InspectionImage url={alert.inspectionImageUrl} />,
          },
        ]}
        defaultValue={<>&mdash;</>}
      />
      <DataList
        title="Asset"
        details={[
          {
            label: "Name",
            value: alert.asset?.name,
          },
          {
            label: "Product",
            value: alert.asset?.product.name,
          },
          {
            label: "Placement",
            value: [alert.asset?.location, alert.asset?.placement].join(" - "),
          },
        ]}
        defaultValue={<>&mdash;</>}
      />
      <DataList
        title="Inspection"
        details={[
          {
            label: "Inspector",
            value:
              alert.inspection?.inspector &&
              `${alert.inspection.inspector.firstName} ${alert.inspection.inspector.lastName}`,
          },
          {
            label: "Comments",
            value: alert.inspection?.comments,
          },
        ]}
        defaultValue={<>&mdash;</>}
      />
      <FormProvider {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="resolutionNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resolution Note</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    readOnly={alert.resolved}
                    disabled={!canResolve}
                    title={
                      !canResolve ? "You do not have permission to resolve this alert." : undefined
                    }
                  />
                </FormControl>
                <FormDescription>Make note of action taken to resolve this alert.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          {canResolve && (
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || loading || !isValid || alert.resolved}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              {alert.resolved ? (
                <>
                  <Check /> Resolved
                </>
              ) : (
                <>Mark as Resolved</>
              )}
            </Button>
          )}
        </form>
      </FormProvider>
    </div>
  );
}

function InspectionImage({ url }: { url: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Image /> Preview
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        <img src={url} alt="Preview" className="w-full rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}
