import { Circle } from "lucide-react";
import { capitalize, cn } from "~/lib/utils";
import { Badge } from "./ui/badge";

export default function ActiveIndicatorBadge({
  active: activeProp,
  className,
}: {
  active: boolean | "active" | "inactive" | "pending" | "legacy";
  className?: string;
}) {
  const status = activeProp === true ? "active" : activeProp === false ? "inactive" : activeProp;
  return (
    <Badge
      className={cn(
        status === "active"
          ? "bg-primary/10 border-primary/50 text-primary/80"
          : status === "pending"
            ? "bg-pending/10 border-pending/50 text-pending"
            : "bg-muted/10 border-muted-foreground/50 text-muted-foreground/80",
        className
      )}
      title={capitalize(status)}
    >
      <Circle
        className={cn(
          status === "active"
            ? "fill-primary text-primary"
            : status === "pending"
              ? "fill-pending text-pending"
              : "text-muted-foreground fill-muted-foreground/20"
        )}
      />
      {typeof status === "string" && (
        <div className="text-xs font-semibold uppercase">{status}</div>
      )}
    </Badge>
  );
}
