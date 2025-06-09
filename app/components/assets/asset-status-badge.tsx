import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { AlertsStatus, type AssetInspectionsStatus } from "~/lib/enums";
import { cn } from "~/lib/utils";
import { Badge } from "../ui/badge";

function StatusBadge({
  icon: IconComponent,
  status,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary py-1",
        className
      )}
    >
      <IconComponent className="mr-1 size-4" />
      {status}
    </Badge>
  );
}

export function InspectionStatusBadge({
  status,
}: {
  status: AssetInspectionsStatus | undefined | null;
}) {
  return status === "COMPLIANT_DUE_LATER" ? (
    <StatusBadge
      icon={CircleCheck}
      status="Compliant"
      className="bg-status-compliant text-status-compliant-foreground hover:bg-status-compliant"
    />
  ) : status === "COMPLIANT_DUE_SOON" ? (
    <StatusBadge
      icon={CircleAlert}
      status="Due Soon"
      className="bg-status-due-soon text-status-due-soon-foreground hover:bg-status-due-soon"
    />
  ) : status === "NON_COMPLIANT_INSPECTED" ? (
    <StatusBadge
      icon={CircleX}
      status="Non-Compliant"
      className="bg-status-non-compliant text-status-non-compliant-foreground hover:bg-status-non-compliant"
    />
  ) : status === "NON_COMPLIANT_NEVER_INSPECTED" ? (
    <StatusBadge
      icon={Clock}
      status="Never Inspected"
      className="bg-status-never text-status-never-foreground hover:bg-status-never"
    />
  ) : (
    <StatusBadge
      icon={CircleHelp}
      status="Unknown"
      className="bg-secondary-never text-secondary-never-foreground hover:bg-secondary-never"
    />
  );
}

export function AlertsStatusBadge({ status }: { status: AlertsStatus }) {
  return status === AlertsStatus.CRITICAL ? (
    <StatusBadge
      icon={ShieldX}
      status="Critical Alerts Present"
      className="bg-critical text-critical-foreground hover:bg-critical"
    />
  ) : status === AlertsStatus.URGENT ? (
    <StatusBadge
      icon={ShieldX}
      status="Urgent Alerts Present"
      className="bg-urgent text-urgent-foreground hover:bg-urgent"
    />
  ) : status === AlertsStatus.WARNING ? (
    <StatusBadge
      icon={ShieldAlert}
      status="Alerts Present"
      className="bg-important text-important-foreground hover:bg-important"
    />
  ) : status === AlertsStatus.INFO ? (
    <StatusBadge
      icon={ShieldAlert}
      status="Info Alerts Present"
      className="bg-important text-important-foreground hover:bg-important"
    />
  ) : status === AlertsStatus.AUDIT ? (
    <StatusBadge
      icon={ShieldX}
      status="Audit Alerts Present"
      className="bg-audit text-audit-foreground hover:bg-audit"
    />
  ) : (
    <StatusBadge
      icon={ShieldCheck}
      status="No Alerts"
      className="bg-status-compliant text-status-compliant-foreground hover:bg-status-compliant"
    />
  );
}
