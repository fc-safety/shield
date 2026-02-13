import { ChevronRight, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import AssetInspectionAlert from "~/components/assets/asset-inspection-alert";
import HydrationSafeFormattedDate from "~/components/common/hydration-safe-formatted-date";
import DisplayRelativeDate from "~/components/display-relative-date";
import AlertLevelBadge from "~/components/inspections/alert-level-badge";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Alert } from "~/lib/models";
import { cn, dateSort } from "~/lib/utils";

export default function AlertsCard({ assetId, alerts }: { assetId: string; alerts: Alert[] }) {
  const unresolvedAlerts = useMemo(() => {
    return [...(alerts ?? [])].filter((a) => !a.resolved).sort(dateSort("createdOn", false));
  }, [alerts]);

  const sortedAlerts = useMemo(() => {
    return [...(alerts ?? [])].sort(dateSort("createdOn", true));
  }, [alerts]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 sm:pb-2">
        <CardTitle>
          <ShieldAlert />
          <div className="flex items-center gap-1.5">
            Alerts
            {unresolvedAlerts.length > 0 && (
              <span className="bg-urgent text-urgent-foreground flex size-5 items-center justify-center rounded-full text-xs">
                {unresolvedAlerts.length}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "flex grow flex-col justify-center gap-2",
          unresolvedAlerts.length > 0 ? "justify-start" : "justify-center"
        )}
      >
        {unresolvedAlerts.length > 0 ? (
          <div>
            {unresolvedAlerts.map((alert, idx) => (
              <AlertItem key={alert.id} alert={alert} idx={idx} assetId={assetId} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-center text-xs">
            This asset has no {alerts.length > 0 ? "unresolved " : ""}alerts.
          </div>
        )}

        <ResponsiveDialog
          title="Alert History"
          trigger={
            <button
              className={cn(
                "text-primary self-center text-sm",
                alerts.length === 0 ? "hidden" : "block"
              )}
            >
              View alert history &rarr;
            </button>
          }
        >
          <div>
            {sortedAlerts.map((alert, idx) => (
              <AlertItem key={alert.id} alert={alert} idx={idx} assetId={assetId} />
            ))}
          </div>
        </ResponsiveDialog>
      </CardContent>
    </Card>
  );
}

const AlertItem = ({ alert, idx, assetId }: { alert: Alert; idx: number; assetId: string }) => {
  return (
    <AssetInspectionAlert
      assetId={assetId}
      alertId={alert.id}
      trigger={
        <div
          className={cn(
            "group border-border flex cursor-pointer items-center gap-x-2 py-2.5",
            idx > 0 && "border-t"
          )}
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-light">
              <span>
                <HydrationSafeFormattedDate date={alert.createdOn} formatStr="PPpp" /> &bull;{" "}
                <DisplayRelativeDate date={alert.createdOn} className="font-semibold" />
              </span>
              <AlertLevelBadge resolved={alert.resolved} alertLevel={alert.alertLevel} />
            </div>
          </div>
          <ChevronRight className="text-muted-foreground group-hover:text-primary size-5 transition-all group-hover:translate-x-1" />
        </div>
      }
    />
  );
};
