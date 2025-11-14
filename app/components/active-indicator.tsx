import { capitalize, cn } from "~/lib/utils";

export default function ActiveIndicator({
  active: activeProp,
}: {
  active: boolean | "active" | "inactive" | "pending" | "legacy";
}) {
  const status = activeProp === true ? "active" : activeProp === false ? "inactive" : activeProp;

  return (
    <div className="relative size-3" title={capitalize(status)}>
      {status === "active" && (
        <div className="bg-primary absolute inset-0 animate-ping rounded-full"></div>
      )}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          status === "active"
            ? "bg-primary"
            : status === "pending"
              ? "bg-pending"
              : "bg-muted-foreground",
          status === "pending" && "animate-pulse"
        )}
      ></div>
    </div>
  );
}
