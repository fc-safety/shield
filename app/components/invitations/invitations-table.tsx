import type { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "~/contexts/auth-context";
import { useViewContext } from "~/contexts/view-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Invitation } from "~/lib/types";
import { can } from "~/lib/users";
import ConfirmationDialog from "../confirmation-dialog";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { InvitationStatusBadge } from "./invitation-status-badge";

interface InvitationsTableProps {
  invitations: Invitation[];
  onInvitationRevoked?: () => void;
}

export function InvitationsTable({ invitations, onInvitationRevoked }: InvitationsTableProps) {
  const { user } = useAuth();
  const viewContext = useViewContext();
  const canDeleteInvitation = can(user, "delete", "invitations");

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
      draft.message = `Are you sure you want to revoke this invitation${invitation.email ? ` for ${invitation.email}` : ""}? The invite link will no longer work.`;
      draft.onConfirm = () => {
        submitRevoke(null, {
          method: "DELETE",
          path: `/api/proxy/invitations/${invitation.id}`,
          viewContext,
        });
      };
    });
  };

  const copyInviteLink = async (invitation: Invitation) => {
    if (invitation.inviteUrl) {
      await navigator.clipboard.writeText(invitation.inviteUrl);
      toast.success("Invite link copied to clipboard");
    }
  };

  const columns: ColumnDef<Invitation>[] = useMemo(
    () => [
      {
        accessorKey: "status",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => <InvitationStatusBadge status={getValue() as Invitation["status"]} />,
      },
      {
        accessorKey: "email",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const email = getValue() as string | undefined;
          return email || <span className="text-muted-foreground">Anyone with link</span>;
        },
      },
      {
        accessorFn: (row) => row.role?.name,
        id: "role",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const role = getValue() as string | undefined;
          return role || <span className="text-muted-foreground">&mdash;</span>;
        },
      },
      {
        accessorFn: (row) => row.site?.name,
        id: "site",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const site = getValue() as string | undefined;
          return site || <span className="text-muted-foreground">&mdash;</span>;
        },
      },
      {
        accessorKey: "expiresOn",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const expiresOn = getValue() as string;
          const isExpired = new Date(expiresOn) < new Date();
          return (
            <span className={isExpired ? "text-muted-foreground" : ""}>
              {new Date(expiresOn).toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "createdOn",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const invitation = row.original;
          const isPending = invitation.status === "PENDING";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isPending && invitation.inviteUrl && (
                  <>
                    <DropdownMenuItem onClick={() => copyInviteLink(invitation)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isPending && canDeleteInvitation && (
                  <DropdownMenuItem
                    onClick={() => revokeInvitation(invitation)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revoke
                  </DropdownMenuItem>
                )}
                {!isPending && !canDeleteInvitation && (
                  <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canDeleteInvitation, viewContext]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={invitations}
        searchPlaceholder="Search by email..."
      />
      <ConfirmationDialog {...confirmAction} />
    </>
  );
}
