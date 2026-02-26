import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Shield, ShieldOff, SquareAsterisk, UserPen, Users } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { guardOrSendHome } from "~/.server/guard";
import ActiveIndicator2 from "~/components/active-indicator-2";
import AdminEditUserForm from "~/components/admin/admin-edit-user-form";
import ManageUserAccessForm from "~/components/admin/manage-user-access-form";
import ResetPasswordForm from "~/components/clients/reset-password-form";
import ResponsiveActions from "~/components/common/responsive-actions";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import { CAPABILITIES } from "~/lib/permissions";
import type { updateUserSchema } from "~/lib/schema";
import type { UserResponse } from "~/lib/types";
import { can, isSystemsAdmin } from "~/lib/users";
import { beautifyPhone } from "~/lib/utils";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guardOrSendHome(request, (user) => isSystemsAdmin(user));

  const userResults = await api.users.list(request, { limit: 10000 }, { context: "admin" });

  return {
    users: userResults.results,
    usersTotalCount: userResults.count,
  };
};

export default function AdminAllUsers({
  loaderData: { users, usersTotalCount },
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Users /> All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AllUsersTable users={users} />
          {usersTotalCount > users.length && (
            <p className="text-muted-foreground text-sm">
              Showing {users.length} of {usersTotalCount} users
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AllUsersTableProps {
  users: UserResponse[];
}

function AllUsersTable({ users }: AllUsersTableProps) {
  const { user: currentUser } = useAuth();
  const canManageUsers = can(currentUser, CAPABILITIES.MANAGE_USERS);

  const editUser = useOpenData<UserResponse>();
  const resetPassword = useOpenData<UserResponse>();
  const manageAccess = useOpenData<UserResponse>();

  const { createOrUpdateJson: submit } = useModalFetcher();
  const setUserActive = useCallback(
    (id: string, clientId: string, data: Pick<z.infer<typeof updateUserSchema>, "active">) => {
      submit(data, {
        path: "/api/proxy/users",
        id,
        query: {
          clientId,
        },
        viewContext: "admin",
      });
    },
    [submit]
  );

  const [confirmAction, setConfirmAction] = useConfirmAction();

  const columns: ColumnDef<UserResponse>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => <ActiveIndicator2 active={getValue() as boolean} />,
      },
      {
        accessorFn: (user) => `${user.firstName} ${user.lastName}`.trim(),
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
        accessorFn: (user) =>
          user.clientAccess.map((a) => `${a.role.name} (${a.site.name})`).join(", "),
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
        accessorFn: (user) => {
          const primaryAccess = user.clientAccess.find((a) => a.isPrimary) ?? user.clientAccess[0];
          return primaryAccess?.client.name;
        },
        id: "client",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row }) => {
          const primaryAccess =
            row.original.clientAccess.find((a) => a.isPrimary) ?? row.original.clientAccess[0];
          const client = primaryAccess?.client;
          return !client ? (
            <>&mdash;</>
          ) : (
            <Link
              to={`/admin/clients/${client.id}`}
              className="hover:underline"
              title={`View ${client.name}`}
            >
              {client.name}
            </Link>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original;
          const primaryAccess = user.clientAccess.find((a) => a.isPrimary) ?? user.clientAccess[0];
          const userName = `${user.firstName} ${user.lastName}`.trim();

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
                      disabled: !canManageUsers,
                    },
                    {
                      key: "manage-access",
                      text: "Manage Access",
                      Icon: UserPen,
                      onAction: () => manageAccess.openData(user),
                      disabled: !canManageUsers,
                    },
                    {
                      key: "reset-password",
                      text: "Reset Password",
                      Icon: SquareAsterisk,
                      onAction: () => resetPassword.openData(user),
                      disabled: !canManageUsers,
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
                                {userName} ({user.email})
                              </span>
                              ?
                              <br />
                              <br />
                              Deactivating the user will block the user from logging in and
                              accessing the system. Users can be reactivated at any time.
                            </>
                          );
                          draft.destructive = !!user.active;
                          draft.confirmText = user.active ? "Deactivate" : "Reactivate";
                          draft.onConfirm = () =>
                            setUserActive(user.id, primaryAccess?.client.id ?? "", {
                              active: !user.active,
                            });
                        }),
                      disabled: !canManageUsers,
                    },
                  ],
                },
              ]}
            />
          );
        },
      },
    ],
    [editUser, resetPassword, manageAccess, setUserActive, canManageUsers, setConfirmAction]
  );

  // Get unique clients for filtering
  const clientFilterOptions = useMemo(() => {
    const uniqueClients = new Map<string, string>();
    users.forEach((user) => {
      for (const access of user.clientAccess) {
        uniqueClients.set(access.client.name, access.client.name);
      }
    });
    return Array.from(uniqueClients.values()).map((name) => ({
      label: name,
      value: name,
    }));
  }, [users]);

  // Get the primary client ID for the currently selected user (for forms)
  const getSelectedUserClientId = (selectedUser: UserResponse | null) => {
    if (!selectedUser) return undefined;
    const primaryAccess =
      selectedUser.clientAccess.find((a) => a.isPrimary) ?? selectedUser.clientAccess[0];
    return primaryAccess?.client.id;
  };

  return (
    <>
      <DataTable
        classNames={{
          container: "max-w-full min-w-0",
        }}
        data={users}
        columns={columns}
        initialState={{
          columnVisibility: {
            phoneNumber: false,
          },
        }}
        searchPlaceholder="Search users..."
        filters={({ table }) => [
          {
            title: "Client",
            column: table.getColumn("client"),
            options: clientFilterOptions,
          },
        ]}
      />
      <ResponsiveDialog title="Edit User" open={editUser.open} onOpenChange={editUser.setOpen}>
        {editUser.data && (
          <AdminEditUserForm user={editUser.data} onSubmitted={() => editUser.setOpen(false)} />
        )}
      </ResponsiveDialog>
      {canManageUsers && resetPassword.data && (
        <ResponsiveDialog
          title="Reset Password"
          open={resetPassword.open}
          onOpenChange={resetPassword.setOpen}
        >
          <ResetPasswordForm
            user={resetPassword.data}
            clientId={getSelectedUserClientId(resetPassword.data)}
            onSubmitted={() => resetPassword.setOpen(false)}
          />
        </ResponsiveDialog>
      )}
      <ResponsiveDialog
        title={`Manage Access${manageAccess.data ? ` — ${manageAccess.data.firstName} ${manageAccess.data.lastName}`.trim() : ""}`}
        open={manageAccess.open}
        onOpenChange={manageAccess.setOpen}
        className="sm:max-w-2xl"
      >
        {manageAccess.data && <ManageUserAccessForm user={manageAccess.data} />}
      </ResponsiveDialog>
      <ConfirmationDialog {...confirmAction} />
    </>
  );
}
