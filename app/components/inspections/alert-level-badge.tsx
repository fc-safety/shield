import { Check, OctagonAlert } from "lucide-react";
import type { Alert } from "~/lib/models";
import { cn } from "~/lib/utils";

export default function AlertLevelBadge({
  resolved,
  alertLevel,
}: {
  resolved: boolean;
  alertLevel: Alert["alertLevel"];
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold capitalize [&_svg]:size-3.5 [&_svg]:shrink-0",
        {
          "bg-critical text-critical-foreground": !resolved && alertLevel === "CRITICAL",
          "bg-urgent text-urgent-foreground": !resolved && alertLevel === "URGENT",
          "bg-warning text-warning-foreground": !resolved && alertLevel === "WARNING",
          "bg-info text-info-foreground": !resolved && alertLevel === "INFO",
          "bg-audit text-audit-foreground": !resolved && alertLevel === "AUDIT",
          "bg-muted text-muted-foreground": resolved,
        }
      )}
    >
      {!resolved && alertLevel === "CRITICAL" && <OctagonAlert />}
      {resolved && <Check className="text-primary" />}
      <span
        className={cn({
          "line-through": resolved,
        })}
      >
        {alertLevel.toLowerCase()}
      </span>
    </span>
  );
}
