import type { ColumnDef } from "@tanstack/react-table";
import { SquareAsterisk, Trash2, UserPen, UserPlus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Site } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import type { Member } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import { can } from "~/lib/users";
import { beautifyPhone } from "~/lib/utils";
import ActiveIndicator2 from "../active-indicator-2";
import ResponsiveActions from "../common/responsive-actions";
import ConfirmationDialog from "../confirmation-dialog";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { CreateInvitationDialog } from "../invitations/create-invitation-dialog";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import SendResetPasswordEmailButton from "./send-reset-password-email-button";
import UpdateMemberRoleForm from "./update-member-role-form";

interface MembersTableProps {
  clientId?: string;
  members: Member[];
  sites: Site[];
  onInvitationCreated?: () => void;
  onMemberRemoved?: () => void;
}

export function MembersTable({
  clientId,
  members,
  sites,
  onInvitationCreated,
  onMemberRemoved,
}: MembersTableProps) {
  const { user } = useAuth();
  const canManageUsers = can(user, CAPABILITIES.MANAGE_USERS);

  const updateRole = useOpenData<string>();
  const updateRoleMember = useMemo(
    () => members.find((m) => m.id === updateRole.data),
    [members, updateRole.data]
  );
  const resetPassword = useOpenData<Member>();

  const { submitJson: submitRemoveMember, isSubmitting: isRemovingMember } = useModalFetcher({
    onSubmitted: () => {
      onMemberRemoved?.();
    },
  });

  const [confirmAction, setConfirmAction] = useConfirmAction();

  const handleRemoveMember = useCallback(
    (member: Member) => {
      const memberName = `${member.firstName} ${member.lastName}`.trim();
      setConfirmAction((draft) => {
        draft.open = true;
        draft.title = "Remove Member from Organization";
        draft.message = (
          <>
            Are you sure you want to remove{" "}
            <span className="font-bold">
              {memberName} ({member.email})
            </span>{" "}
            from this organization? This will revoke all their access.
          </>
        );
        draft.destructive = true;
        draft.confirmText = "Remove";
        draft.onConfirm = () => {
          submitRemoveMember(
            {},
            {
              method: "DELETE",
              path: buildPath(`/api/proxy/members/:id`, { id: member.id }),
              query: { clientId },
            }
          );
        };
      });
    },
    [clientId, submitRemoveMember, setConfirmAction]
  );

  const columns: ColumnDef<Member>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => <ActiveIndicator2 active={getValue() as boolean} />,
      },
      {
        accessorFn: (member) => `${member.firstName} ${member.lastName}`.trim(),
        id: "name",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "email",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "phoneNumber",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const phoneNumber = getValue() as string;
          return phoneNumber ? beautifyPhone(phoneNumber) : <>&mdash;</>;
        },
      },
      {
        accessorKey: "position",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => (getValue() as string) ?? <>&mdash;</>,
      },
      {
        accessorFn: (member) =>
          member.clientAccess.map((a) => `${a.role.name} (${a.site.name})`).join(", "),
        id: "roles",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row }) => {
          const access = row.original.clientAccess;

          if (access.length === 0) {
            return <>&mdash;</>;
          }

          return (
            <div className="flex flex-col gap-1">
              {access.map((a) => (
                <span key={a.id} className="text-sm">
                  <span className="font-medium">{a.role.name}</span>
                  <span className="text-muted-foreground"> @ {a.site.name}</span>
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const member = row.original;

          return (
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "manage-roles",
                      text: "Manage Roles",
                      Icon: UserPen,
                      onAction: () => updateRole.openData(member.id),
                      disabled: !canManageUsers,
                    },
                    {
                      key: "reset-password",
                      text: "Reset Password",
                      Icon: SquareAsterisk,
                      onAction: () => resetPassword.openData(member),
                      disabled: !canManageUsers,
                    },
                  ],
                },
                {
                  key: "destructive-actions",
                  actions: [
                    {
                      key: "remove-member",
                      text: "Remove from Organization",
                      Icon: Trash2,
                      variant: "destructive",
                      onAction: () => handleRemoveMember(member),
                      disabled: !canManageUsers || isRemovingMember,
                    },
                  ],
                },
              ]}
            />
          );
        },
      },
    ],
    [updateRole, resetPassword, canManageUsers, handleRemoveMember, isRemovingMember]
  );

  return (
    <>
      <DataTable
        classNames={{
          container: "max-w-full min-w-0",
        }}
        data={members}
        columns={columns}
        initialState={{
          columnVisibility: {
            phoneNumber: false,
          },
        }}
        searchPlaceholder="Search members..."
        actions={[
          canManageUsers ? (
            <CreateInvitationDialog
              key="invite"
              clientId={clientId}
              trigger={
                <Button size="sm">
                  <UserPlus className="h-4 w-4" />
                  Invite Members
                </Button>
              }
              onCreated={() => onInvitationCreated?.()}
            />
          ) : null,
        ]}
        filters={({ table }) => [
          {
            title: "Site",
            column: table.getColumn("roles"),
            options: sites.map((s) => ({
              label: s.name,
              value: s.name,
            })),
          },
        ]}
      />
      {canManageUsers && updateRoleMember && (
        <ResponsiveDialog
          title="Manage Roles"
          description="Manage the roles and sites for this member."
          open={updateRole.open}
          onOpenChange={updateRole.setOpen}
          disableDisplayTable
          dialogClassName="sm:max-w-3xl"
        >
          <div className="h-4"></div>
          <UpdateMemberRoleForm member={updateRoleMember} clientId={clientId} />
          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => updateRole.setOpen(false)}>
              Close
            </Button>
          </div>
        </ResponsiveDialog>
      )}
      {canManageUsers && resetPassword.data && (
        <ResponsiveDialog
          title="Reset Password"
          open={resetPassword.open}
          onOpenChange={resetPassword.setOpen}
        >
          <SendResetPasswordEmailButton
            member={resetPassword.data}
            clientId={clientId}
            onSent={() => resetPassword.setOpen(false)}
          />
        </ResponsiveDialog>
      )}
      <ConfirmationDialog {...confirmAction} />
    </>
  );
}
