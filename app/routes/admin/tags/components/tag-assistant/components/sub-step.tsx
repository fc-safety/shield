import type { ReactNode } from "react";
import { Badge } from "~/components/ui/badge";

export default function SubStep({
  idx,
  title,
  prefix = "Step",
  children,
}: React.PropsWithChildren<{
  idx: number;
  title: ReactNode;
  prefix?: string;
}>) {
  return (
    <div className="w-full space-y-2">
      <h4 className="text-sm flex items-center gap-2">
        <Badge variant="default" className="text-sm whitespace-nowrap">
          {prefix} {idx + 1}
        </Badge>
        <span>{title}</span>
      </h4>
      {children}
    </div>
  );
}
