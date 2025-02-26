import { capitalize, cn } from "~/lib/utils";

export default function ActiveIndicator({
  active: activeProp,
}: {
  active: boolean | "active" | "inactive" | "pending";
}) {
  const status =
    activeProp === true
      ? "active"
      : activeProp === false
      ? "inactive"
      : activeProp;

  return (
    <div className="relative size-3" title={capitalize(status)}>
      {status === "active" && (
        <div className="absolute inset-0 bg-primary animate-ping rounded-full"></div>
      )}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          status === "active"
            ? "bg-primary"
            : status === "inactive"
            ? "bg-muted-foreground"
            : "bg-pending",
          status === "pending" && "animate-pulse"
        )}
      ></div>
    </div>
  );
}
