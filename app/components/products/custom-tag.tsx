import { cn } from "~/lib/utils";

export default function CustomTag({
  className,
  text = "Custom",
}: {
  className?: string;
  text?: string;
}) {
  return (
    <span
      className={cn(
        "rounded px-1 py-0.5 bg-important text-important-foreground text-xs",
        className
      )}
    >
      {text}
    </span>
  );
}
