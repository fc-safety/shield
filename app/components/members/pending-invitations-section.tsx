import { ChevronDown, Copy, MoreHorizontal, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { CAPABILITIES } from "~/lib/permissions";
import type { Invitation } from "~/lib/types";
import { can } from "~/lib/users";
import { cn } from "~/lib/utils";
import ConfirmationDialog from "../confirmation-dialog";
import { InvitationStatusBadge } from "../invitations/invitation-status-badge";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface PendingInvitationsSectionProps {
  invitations: Invitation[];
  onInvitationRevoked?: () => void;
}

export function PendingInvitationsSection({
  invitations,
  onInvitationRevoked,
}: PendingInvitationsSectionProps) {
  const { user } = useAuth();
  const canDeleteInvitation = can(user, CAPABILITIES.MANAGE_USERS);
  const [isOpen, setIsOpen] = useState(true);

  const { submitJson: submitRevoke } = useModalFetcher({
    onSubmitted: () => {
      toast.success("Invitation revoked");
      onInvitationRevoked?.();
    },
  });

  const [confirmAction, setConfirmAction] = useConfirmAction({
    variant: "destructive",
  });

  const revokeInvitation = (invitation: Invitation) => {
    setConfirmAction((draft) => {
      draft.open = true;
      draft.title = "Revoke Invitation";
      draft.message = `Are you sure you want to revoke the invitation for ${invitation.email}? The invite link will no longer work.`;
      draft.onConfirm = () => {
        submitRevoke(
          {},
          {
            method: "DELETE",
            path: `/api/proxy/invitations/${invitation.id}`,
          }
        );
      };
    });
  };

  const copyInviteLink = async (invitation: Invitation) => {
    if (invitation.inviteUrl) {
      await navigator.clipboard.writeText(invitation.inviteUrl);
      toast.success("Invite link copied to clipboard");
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-0 hover:bg-transparent"
              >
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Pending Invitations
                  <Badge variant="secondary">{invitations.length}</Badge>
                </CardTitle>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <InvitationStatusBadge status={invitation.status} />
                      </TableCell>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        {invitation.role?.name || (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {invitation.site?.name || (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(invitation.expiresOn).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {invitation.inviteUrl && (
                              <>
                                <DropdownMenuItem onClick={() => copyInviteLink(invitation)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canDeleteInvitation && (
                              <DropdownMenuItem
                                onClick={() => revokeInvitation(invitation)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      <ConfirmationDialog {...confirmAction} />
    </>
  );
}
