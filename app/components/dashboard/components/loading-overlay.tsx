import { Badge } from "~/components/ui/badge";

export default function LoadingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center absolute inset-0 z-10 rounded-[inherit]">
      <Badge className="animate-pulse" variant="secondary">
        Loading...
      </Badge>
    </div>
  );
}
