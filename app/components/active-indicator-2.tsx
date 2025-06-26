import { capitalize, cn } from "~/lib/utils";

export default function ActiveIndicator2({
  active: activeProp,
  className,
}: {
  active: boolean | "active" | "inactive" | "pending" | "legacy";
  className?: string;
}) {
  const status =
    activeProp === true
      ? "active"
      : activeProp === false
      ? "inactive"
      : activeProp;
  return (
    <span
      title={capitalize(status)}
      className={cn(
        "inline-block size-2.5 rounded-full border",
        status === "active"
          ? "bg-primary border-primary"
          : status === "pending"
          ? "bg-pending border-pending"
          : "bg-muted border-muted-foreground/80",
        className
      )}
    ></span>
  );
}
