import { capitalize, cn } from "~/lib/utils";

export default function ActiveIndicatorBadge({
  active: activeProp,
  className,
}: {
  active: boolean | "active" | "inactive" | "pending" | "legacy";
  className?: string;
}) {
  const status = activeProp === true ? "active" : activeProp === false ? "inactive" : activeProp;
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border px-2 py-1 text-sm",
        status === "active"
          ? "bg-primary/10 border-primary/50 text-primary/80"
          : status === "pending"
            ? "bg-pending/10 border-pending/50 text-pending"
            : "bg-muted/10 border-muted-foreground/50 text-muted-foreground/80",
        className
      )}
    >
      <div
        title={capitalize(status)}
        className={cn(
          "size-2.5 rounded-full border",
          status === "active"
            ? "bg-primary border-primary"
            : status === "pending"
              ? "bg-pending border-pending"
              : "bg-muted border-muted-foreground/80"
        )}
      ></div>
      {typeof status === "string" && (
        <div className="text-xs font-semibold uppercase">{status}</div>
      )}
    </div>
  );
}
