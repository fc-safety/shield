import { Check, Clock, X, XCircle } from "lucide-react";
import type { InvitationStatus } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Badge } from "../ui/badge";

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
  className?: string;
}

const statusConfig: Record<
  InvitationStatus,
  {
    label: string;
    icon: typeof Clock;
    className: string;
  }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  ACCEPTED: {
    label: "Accepted",
    icon: Check,
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  EXPIRED: {
    label: "Expired",
    icon: XCircle,
    className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  },
  REVOKED: {
    label: "Revoked",
    icon: X,
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
};

export function InvitationStatusBadge({ status, className }: InvitationStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
