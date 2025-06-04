import type { PropsWithChildren } from "react";
import { Badge } from "~/components/ui/badge";

export default function EmptyStateOverlay({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col items-center justify-center h-full absolute bg-background/70 inset-0 z-10 rounded-[inherit]">
      <Badge variant="secondary">{children}</Badge>
    </div>
  );
}
