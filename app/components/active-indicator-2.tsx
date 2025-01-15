import { Power, PowerOff } from "lucide-react";
import { cn } from "~/lib/utils";

export default function ActiveIndicator2({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <span
      title={active ? "Active" : "Inactive"}
      className={cn("h-max w-max", className)}
    >
      {active ? (
        <Power className="size-4 text-primary" />
      ) : (
        <PowerOff className="size-4 text-muted-foreground" />
      )}
    </span>
  );
}
