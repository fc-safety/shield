import type { ProductRequestStatus } from "~/lib/models";
import { cn } from "~/lib/utils";
import { Badge } from "../ui/badge";

export function ProductRequestStatusBadge({
  status,
  children,
  className,
}: {
  status: ProductRequestStatus;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        {
          "bg-warning/40 dark:bg-warning/20 border-warning-foreground/50 dark:border-warning/50 text-warning-foreground dark:text-warning":
            status === "NEW",
          "bg-info/40 dark:bg-info/20 border-info-foreground/50 dark:border-info/50 text-info-foreground dark:text-info":
            status === "PROCESSING",
          "bg-critical-foreground/40 dark:bg-critical/20 border-critical/50 dark:border-critical/50 text-critical":
            status === "FULFILLED",
          "bg-primary/10 border-primary/50 text-primary": status === "COMPLETE",
          "bg-audit/40 dark:bg-audit/10 border-audit-foreground/50 dark:border-audit/50 text-audit-foreground dark:text-audit":
            status === "CANCELLED",
        },
        className
      )}
    >
      {children ?? status}
    </Badge>
  );
}
