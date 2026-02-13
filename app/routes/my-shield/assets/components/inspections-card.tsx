import { formatDistanceToNow } from "date-fns";
import { BellRing, ChevronRight, SearchCheck } from "lucide-react";
import { useMemo, useState } from "react";
import AssetInspectionDialog from "~/components/assets/asset-inspection-dialog";
import HydrationSafeFormattedDate from "~/components/common/hydration-safe-formatted-date";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { SendNotificationsForm } from "~/components/send-notifications-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import type { Asset, Inspection } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { can, getUserDisplayName } from "~/lib/users";
import { cn, dateSort } from "~/lib/utils";

export default function InspectionsCard({
  inspections,
  asset,
}: {
  inspections: Inspection[];
  asset: Asset;
}) {
  const { user } = useAuth();
  const canSendNotificationsToTeam = can(user, CAPABILITIES.MANAGE_USERS);

  const sortedInspections = useMemo(() => {
    return [...(inspections ?? [])].sort(dateSort("createdOn", true));
  }, [inspections]);

  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-4">
        <CardTitle>
          <SearchCheck /> Inspection History
          <div className="flex-1"></div>
          {canSendNotificationsToTeam && <NotifyTeamButton asset={asset} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inspections.length === 0 && (
          <div className="text-muted-foreground text-center text-xs">
            This asset has no inspection history.
          </div>
        )}
        {sortedInspections.map((inspection, idx) => (
          <AssetInspectionDialog
            key={inspection.id}
            inspectionId={inspection.id}
            trigger={(isLoading, preloadInspection, setOpen) => (
              <div
                className={cn(
                  "group border-border flex cursor-pointer items-center gap-x-2 py-2.5",
                  idx > 0 && "border-t"
                )}
                onTouchStart={() => preloadInspection(inspection.id)}
                onMouseEnter={() => preloadInspection(inspection.id)}
              >
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-light">
                    <HydrationSafeFormattedDate date={inspection.createdOn} formatStr="PPpp" />
                  </div>
                  <div>
                    <p className="text-sm">
                      Inspected{" "}
                      {formatDistanceToNow(inspection.createdOn, {
                        addSuffix: true,
                      })}{" "}
                      by{" "}
                      <span className="font-semibold">
                        {inspection.inspector
                          ? getUserDisplayName(inspection.inspector)
                          : "Unknown Inspector"}
                      </span>
                      .
                    </p>
                  </div>
                  {inspection.comments && (
                    <p className="line-clamp-2 text-sm italic">"{inspection.comments}"</p>
                  )}
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary size-5 transition-all group-hover:translate-x-1" />
              </div>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function NotifyTeamButton({ asset }: { asset: Asset }) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={
        <span className="flex items-center gap-2">
          <BellRing className="size-4" /> Notify Your Team
        </span>
      }
      description="Send an inspection reminder notification to select users on your team."
      trigger={
        <Button size="sm">
          <BellRing /> Notify Team
        </Button>
      }
    >
      <div className="mt-4">
        <SendNotificationsForm
          siteExternalId={asset.site?.externalId}
          endpointPath={`/api/proxy/assets/${asset.id}/send-reminder-notifications`}
          onSent={() => setOpen(false)}
        />
      </div>
    </ResponsiveDialog>
  );
}
