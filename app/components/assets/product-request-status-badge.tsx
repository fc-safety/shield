import { useMemo, type ComponentProps } from "react";
import type { ProductRequestStatus } from "~/lib/models";
import { Badge } from "../ui/badge";

export function ProductRequestStatusBadge({
  status,
}: {
  status: ProductRequestStatus;
}) {
  const variant = useMemo((): ComponentProps<typeof Badge>["variant"] => {
    switch (status) {
      case "PROCESSING":
      case "COMPLETE":
        return "secondary";
      case "FULFILLED":
        return "default";
      default:
        return "outline";
    }
  }, [status]);
  return <Badge variant={variant}>{status}</Badge>;
}
