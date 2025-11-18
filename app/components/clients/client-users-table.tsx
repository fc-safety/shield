import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Shield, ShieldOff, SquareAsterisk, UserPen } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { z } from "zod";
import type { ViewContext } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Site } from "~/lib/models";
import type { updateUserSchema } from "~/lib/schema";
import type { ClientUser } from "~/lib/types";
import { can } from "~/lib/users";
import { beautifyPhone } from "~/lib/utils";
import ActiveIndicator2 from "../active-indicator-2";
import ResponsiveActions from "../common/responsive-actions";
import ConfirmationDialog from "../confirmation-dialog";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import ClientUserDetailsForm from "./client-user-details-form";
import EditUserButton from "./edit-client-user-button";
import ResetPasswordForm from "./reset-password-form";
import UpdateUserRoleForm from "./update-user-role-form";

interface ClientUsersTableProps {
  clientId?: string;
  siteExternalId?: string;
  users: ClientUser[];
  getSiteByExternalId?: (externalId: string) => Site | undefined;
  viewContext?: ViewContext;
}

export default function ClientUsersTable({
  clientId,
  siteExternalId,
  users,
  getSiteByExternalId,
  viewContext,
}: ClientUsersTableProps) {
  const { user } = useAuth();
  const canCreateUser = can(user, "create", "users");
  const canUpdateUser = can(user, "update", "users");

  const editUser = useOpenData<ClientUser>();
  const updateRole = useOpenData<ClientUser>();
  const resetPassword = useOpenData<ClientUser>();
  const { createOrUpdateJson: submit } = useModalFetcher();
  const setUserActive = useCallback(
    (id: string, data: Pick<z.infer<typeof updateUserSchema>, "active">) => {
      submit(data, {
        path: "/api/proxy/users",
        id,
        query: {
          clientId,
        },
        viewContext,
      });
    },
    [clientId, submit, viewContext]
  );

  const [confirmAction, setConfirmAction] = useConfirmAction();

  const clientUserColumns: ColumnDef<ClientUser>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => <ActiveIndicator2 active={getValue() as boolean} />,
      },
      {
        accessorKey: "name",
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
        accessorFn: (user) => user.roles.map((r) => r.name),
        id: "roles",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const roleNames = getValue() as string[];

          if (roleNames.length === 0) {
            return <>&mdash;</>;
          }

          return <span>{roleNames.join(", ")}</span>;
        },
      },
      {
        accessorFn: (datat) => getSiteByExternalId?.(datat.siteExternalId)?.name,
        id: "site",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => (getValue() as string) ?? <>&mdash;</>,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original;

          return (
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "edit",
                      text: "Edit",
                      Icon: Pencil,
                      onAction: () => editUser.openData(user),
                      disabled: !canUpdateUser,
                    },
                    {
                      key: "manage-roles",
                      text: "Manage Roles",
                      Icon: UserPen,
                      onAction: () => updateRole.openData(user),
                      disabled: !canUpdateUser,
                    },
                    {
                      key: "reset-password",
                      text: "Reset Password",
                      Icon: SquareAsterisk,
                      onAction: () => resetPassword.openData(user),
                      disabled: !canUpdateUser,
                    },
                  ],
                },
                {
                  key: "destructive-actions",
                  actions: [
                    {
                      key: "set-active",
                      text: user.active ? "Deactivate" : "Reactivate",
                      Icon: user.active ? ShieldOff : Shield,
                      variant: user.active ? "destructive" : "default",
                      onAction: () =>
                        setConfirmAction((draft) => {
                          draft.open = true;
                          draft.title = user.active ? "Deactivate User" : "Reactivate User";
                          draft.message = (
                            <>
                              Are you sure you want to {user.active ? "deactivate" : "reactivate"}{" "}
                              <span className="font-bold">
                                {user.name} ({user.email})
                              </span>
                              ?
                            </>
                          );
                          draft.destructive = !!user.active;
                          draft.confirmText = user.active ? "Deactivate" : "Reactivate";
                          // draft.cancelText = user.active ? "Cancel" : "Close";
                          draft.onConfirm = () => setUserActive(user.id, { active: !user.active });
                        }),
                      disabled: !canUpdateUser,
                    },
                  ],
                },
              ]}
            />
          );
        },
      },
    ],
    [getSiteByExternalId, editUser, updateRole, resetPassword, setUserActive]
  );

  return (
    <>
      <DataTable
        classNames={{
          container: "max-w-full min-w-0",
        }}
        data={users}
        columns={clientUserColumns}
        initialState={{
          columnVisibility: {
            site: !!getSiteByExternalId,
          },
        }}
        searchPlaceholder="Search users..."
        actions={[
          canCreateUser ? (
            <EditUserButton
              key="add"
              clientId={clientId}
              siteExternalId={siteExternalId}
              viewContext={viewContext}
            />
          ) : null,
        ]}
      />
      <ResponsiveDialog title="Edit User" open={editUser.open} onOpenChange={editUser.setOpen}>
        <ClientUserDetailsForm
          clientId={clientId}
          siteExternalId={siteExternalId}
          user={editUser.data ?? undefined}
          onSubmitted={() => editUser.setOpen(false)}
          viewContext={viewContext}
        />
      </ResponsiveDialog>
      {canUpdateUser && updateRole.data && (
        <ResponsiveDialog
          title="Manage Roles"
          open={updateRole.open}
          onOpenChange={updateRole.setOpen}
        >
          <UpdateUserRoleForm
            user={updateRole.data}
            clientId={clientId}
            viewContext={viewContext}
          />
          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => updateRole.setOpen(false)}>
              Close
            </Button>
          </div>
        </ResponsiveDialog>
      )}
      {canUpdateUser && resetPassword.data && (
        <ResponsiveDialog
          title="Reset Password"
          open={resetPassword.open}
          onOpenChange={resetPassword.setOpen}
        >
          <ResetPasswordForm
            user={resetPassword.data}
            clientId={clientId}
            onSubmitted={() => resetPassword.setOpen(false)}
          />
        </ResponsiveDialog>
      )}
      <ConfirmationDialog {...confirmAction} />
    </>
  );
}
