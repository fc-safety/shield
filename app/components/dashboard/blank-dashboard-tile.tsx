import type { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export default function BlankDashboardTile({
  className,
  children,
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <div className={cn("aspect-video rounded-xl bg-muted/50", className)}>
      {children}
    </div>
  );
}
