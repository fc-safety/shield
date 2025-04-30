import type { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export default function BlankDashboardTile({
  className,
  children,
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <div className={cn("min-h-64 rounded-xl bg-muted/50", className)}>
      {children}
    </div>
  );
}
