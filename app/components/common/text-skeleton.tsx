import { cn } from "~/lib/utils";

export default function TextSkeleton({
  className,
  size = 15,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "bg-accent/80 inline animate-pulse rounded-md align-middle break-all text-transparent",
        className
      )}
    >
      {Array.from({ length: size }).map(() => "_")}
    </span>
  );
}
