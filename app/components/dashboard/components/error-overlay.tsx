import { AlertTriangle } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Badge } from "~/components/ui/badge";

export default function ErrorOverlay({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col items-center justify-center absolute inset-0 z-10 rounded-[inherit]">
      <Badge variant="destructive">
        <AlertTriangle className="size-3.5 mr-1" />
        {children}
      </Badge>
    </div>
  );
}
