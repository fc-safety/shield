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
    <Badge className={cn("bg-primary text-primary-foreground hover:bg-primary py-1", className)}>
      <IconComponent className="mr-1 size-4" />
      {status}
    </Badge>
  );
}

export function InspectionStatusBadge({
  status,
  className,
}: {
  status: AssetInspectionsStatus | undefined | null;
  className?: string;
}) {
  return status === "COMPLIANT_DUE_LATER" ? (
    <StatusBadge
      icon={CircleCheck}
      status="Compliant"
      className={cn(
        "bg-status-compliant text-status-compliant-foreground hover:bg-status-compliant",
        className
      )}
    />
  ) : status === "COMPLIANT_DUE_SOON" ? (
    <StatusBadge
      icon={CircleAlert}
      status="Due Soon"
      className={cn(
        "bg-status-due-soon text-status-due-soon-foreground hover:bg-status-due-soon",
        className
      )}
    />
  ) : status === "NON_COMPLIANT_INSPECTED" ? (
    <StatusBadge
      icon={CircleX}
      status="Non-Compliant"
      className={cn(
        "bg-status-non-compliant text-status-non-compliant-foreground hover:bg-status-non-compliant",
        className
      )}
    />
  ) : status === "NON_COMPLIANT_NEVER_INSPECTED" ? (
    <StatusBadge
      icon={Clock}
      status="Never Inspected"
      className={cn(
        "bg-status-never text-status-never-foreground hover:bg-status-never",
        className
      )}
    />
  ) : (
    <StatusBadge
      icon={CircleHelp}
      status="Unknown"
      className={cn(
        "bg-secondary-never text-secondary-never-foreground hover:bg-secondary-never",
        className
      )}
    />
  );
}

export function AlertsStatusBadge({
  status,
  className,
}: {
  status: AlertsStatus;
  className?: string;
}) {
  return status === AlertsStatus.CRITICAL ? (
    <StatusBadge
      icon={ShieldX}
      status="Critical Alerts Present"
      className={cn("bg-critical text-critical-foreground hover:bg-critical", className)}
    />
  ) : status === AlertsStatus.URGENT ? (
    <StatusBadge
      icon={ShieldX}
      status="Urgent Alerts Present"
      className={cn("bg-urgent text-urgent-foreground hover:bg-urgent", className)}
    />
  ) : status === AlertsStatus.WARNING ? (
    <StatusBadge
      icon={ShieldAlert}
      status="Alerts Present"
      className={cn("bg-important text-important-foreground hover:bg-important", className)}
    />
  ) : status === AlertsStatus.INFO ? (
    <StatusBadge
      icon={ShieldAlert}
      status="Info Alerts Present"
      className={cn("bg-important text-important-foreground hover:bg-important", className)}
    />
  ) : status === AlertsStatus.AUDIT ? (
    <StatusBadge
      icon={ShieldX}
      status="Audit Alerts Present"
      className={cn("bg-audit text-audit-foreground hover:bg-audit", className)}
    />
  ) : (
    <StatusBadge
      icon={ShieldCheck}
      status="No Alerts"
      className={cn(
        "bg-status-compliant text-status-compliant-foreground hover:bg-status-compliant",
        className
      )}
    />
  );
}
