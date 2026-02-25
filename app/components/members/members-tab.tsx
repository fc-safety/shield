import { Users } from "lucide-react";
import type { Site } from "~/lib/models";
import type { Invitation, Member } from "~/lib/types";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MembersTable } from "./members-table";
import { PendingInvitationsSection } from "./pending-invitations-section";

interface MembersTabProps {
  members: Member[];
  membersTotalCount?: number;
  sites: Site[];
  clientId?: string;
  pendingInvitations: Invitation[];
  onInvitationCreated?: () => void;
  onInvitationRevoked?: () => void;
  onMemberRemoved?: () => void;
}

export function MembersTab({
  members,
  membersTotalCount,
  sites,
  clientId,
  pendingInvitations,
  onInvitationCreated,
  onInvitationRevoked,
  onMemberRemoved,
}: MembersTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Users /> Active Members <Badge>{membersTotalCount ?? members.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={members}
            sites={sites}
            clientId={clientId}
            onInvitationCreated={onInvitationCreated}
            onMemberRemoved={onMemberRemoved}
          />
        </CardContent>
      </Card>

      <PendingInvitationsSection
        invitations={pendingInvitations}
        onInvitationRevoked={onInvitationRevoked}
      />
    </div>
  );
}
