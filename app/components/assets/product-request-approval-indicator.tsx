import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { ProductRequestApproval } from "~/lib/models";
import { getUserDisplayName } from "~/lib/users";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

export default function ProductRequestApprovalIndicator({
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
                  by{" "}
                  {approval.approver
                    ? getUserDisplayName(approval.approver)
                    : "unknown"}
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium">Rejected</div>
                <div className="text-xs text-muted-foreground">
                  by{" "}
                  {approval.approver
                    ? getUserDisplayName(approval.approver)
                    : "unknown"}
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
