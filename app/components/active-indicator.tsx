import { cn } from "~/lib/utils";

export default function ActiveIndicator({ active }: { active: boolean }) {
  return (
    <div className="relative size-3" title={active ? "Active" : "Inactive"}>
      {active && (
        <div className="absolute inset-0 bg-primary animate-ping rounded-full"></div>
      )}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground"
        )}
      ></div>
    </div>
  );
}
