import type { ProductRequestStatus } from "~/lib/models";
import { Badge } from "../ui/badge";

export function ProductRequestStatusBadge({
  status,
}: {
  status: ProductRequestStatus;
}) {
  return <Badge variant="outline">{status}</Badge>;
}
