import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Check, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { z } from "zod";
import type { Alert } from "~/lib/models";
import { resolveAlertSchema, resolveAlertSchemaResolver } from "~/lib/schema";
import DataList from "../data-list";
import { Skeleton } from "../ui/skeleton";

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
  const fetcher = useFetcher<Alert>();

  const handlePreloadAlerts = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/api/assets/${assetId}/alerts/${alertId}`);
    }
  }, [fetcher, assetId, alertId]);

  useEffect(() => {
    if (fetcher.data) {
      setAlert(fetcher.data);
    }
  }, [fetcher.data]);

  return (
    <ResponsiveDialog
      title="Inspection Alert"
      trigger={<div onMouseEnter={handlePreloadAlerts}>{trigger}</div>}
      dialogClassName="sm:max-w-lg"
    >
      {alert ? (
        <InspectionAlert alert={alert} loading={fetcher.state === "loading"} />
      ) : (
        <Skeleton className="h-64 w-full rounded" />
      )}
    </ResponsiveDialog>
  );
}

type TForm = z.infer<typeof resolveAlertSchema>;

function InspectionAlert({
  alert,
  loading = false,
}: {
  alert: Alert;
  loading?: boolean;
}) {
  const fetcher = useFetcher();

  const form = useForm<TForm>({
    resolver: resolveAlertSchemaResolver,
    defaultValues: {
      resolutionNote: alert.resolutionNote || "",
    },
  });

  const {
    formState: { isValid },
  } = form;

  return (
    <div className="grid gap-8">
      <div className="flex gap-2 items-center">
        {alert.resolved ? (
          <ShieldCheck className="text-primary size-8" />
        ) : alert.alertLevel === "URGENT" ? (
          <ShieldX className="text-urgent size-8" />
        ) : (
          <ShieldAlert className="text-important size-8" />
        )}
        <div>
          <p className="text-xs text-muted-foreground">
            {format(alert.createdOn, "PPpp")}
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
            value: (
              <span className="capitalize">
                {alert.alertLevel.toLowerCase()}
              </span>
            ),
          },
          { label: "Reason", value: alert.message },
          {
            label: "Question",
            value: alert.assetQuestionResponse?.assetQuestion?.prompt,
          },
          {
            label: "Answer",
            value:
              alert.assetQuestionResponse?.assetQuestion?.valueType === "DATE"
                ? format(alert.assetQuestionResponse?.value, "PP")
                : alert.assetQuestionResponse?.value,
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
        <fetcher.Form
          className="space-y-4"
          method="post"
          action={`/api/assets/${alert.assetId}/alerts/${alert.id}/resolve`}
        >
          <FormField
            control={form.control}
            name="resolutionNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resolution Note</FormLabel>
                <FormControl>
                  <Textarea {...field} readOnly={alert.resolved} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <Button
            type="submit"
            className="w-full"
            disabled={
              fetcher.state === "submitting" ||
              loading ||
              !isValid ||
              alert.resolved
            }
          >
            {alert.resolved ? (
              <>
                <Check /> Resolved
              </>
            ) : (
              <>Mark as Resolved</>
            )}
          </Button>
        </fetcher.Form>
      </FormProvider>
    </div>
  );
}
