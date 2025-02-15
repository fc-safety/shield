import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { ProductRequestApproval } from "~/lib/models";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

export default function AssetOrderRequestApprovalIndicator({
  approval,
}: {
  approval: ProductRequestApproval | null;
}) {
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        {!approval ? (
          <CircleDashed className="size-4 text-muted-foreground" />
        ) : approval.approved ? (
          <CheckCircle2 className="size-4 text-green-500" />
        ) : (
          <XCircle className="size-4 text-red-500" />
        )}
      </HoverCardTrigger>
      <HoverCardContent className="w-max">
        <div>
          {approval ? (
            approval.approved ? (
              <div>
                <div className="font-medium">Approved</div>
                <div className="text-xs text-muted-foreground">
                  by {approval.approver.firstName} {approval.approver.lastName}
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium">Rejected</div>
                <div className="text-xs text-muted-foreground">
                  by {approval.approver.firstName} {approval.approver.lastName}
                </div>
              </div>
            )
          ) : (
            "Awaiting approval"
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
