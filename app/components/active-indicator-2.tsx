import { cn } from "~/lib/utils";

export default function ActiveIndicator2({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    // <span
    //   title={active ? "Active" : "Inactive"}
    //   className={cn("h-max w-max", className)}
    // >
    //   {active ? (
    //     <Power className="size-4 text-primary" />
    //   ) : (
    //     <PowerOff className="size-4 text-muted-foreground" />
    //   )}
    // </span>
    <span
      title={active ? "Active" : "Inactive"}
      className={cn(
        "inline-block size-2.5 rounded-full border",
        active
          ? "bg-primary border-primary"
          : "bg-muted border-muted-foreground/80",
        className
      )}
    ></span>
  );
}
