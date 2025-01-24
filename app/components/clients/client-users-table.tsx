import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, UserPen, UserPlus } from "lucide-react";
import { useMemo } from "react";
import { useOpenData } from "~/hooks/use-open-data";
import type { Site } from "~/lib/models";
import type { ClientUser } from "~/lib/types";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ClientUserDetailsForm from "./client-user-details-form";
import EditUserButton from "./edit-client-user-button";
import UpdateUserRoleForm from "./update-user-role-form";

interface ClientUsersTableProps {
  clientId: string;
  siteExternalId?: string;
  users: ClientUser[];
  getSiteByExternalId?: (externalId: string) => Site | undefined;
}

export default function ClientUsersTable({
  clientId,
  siteExternalId,
  users,
  getSiteByExternalId,
}: ClientUsersTableProps) {
  const editUser = useOpenData<ClientUser>();
  const updateRole = useOpenData<ClientUser>();

  const clientUserColumns: ColumnDef<ClientUser>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "email",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "roleName",
        id: "role",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => (getValue() as string) ?? <>&mdash;</>,
      },
      {
        accessorFn: (datat) =>
          getSiteByExternalId?.(datat.siteExternalId)?.name,
        id: "site",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => (getValue() as string) ?? <>&mdash;</>,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => editUser.openData(user)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => updateRole.openData(user)}>
                  {user.roleName ? (
                    <>
                      <UserPen />
                      Change Role
                    </>
                  ) : (
                    <>
                      <UserPlus />
                      Assign Role
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [getSiteByExternalId, editUser, updateRole]
  );

  return (
    <>
      <DataTable
        data={users}
        columns={clientUserColumns}
        initialState={{
          columnVisibility: {
            site: !!getSiteByExternalId,
          },
        }}
        searchPlaceholder="Search users..."
        actions={[
          <EditUserButton
            key="add"
            clientId={clientId}
            siteExternalId={siteExternalId}
          />,
        ]}
      />
      <ResponsiveDialog
        title="Edit User"
        open={editUser.open}
        onOpenChange={editUser.setOpen}
      >
        <ClientUserDetailsForm
          clientId={clientId}
          siteExternalId={siteExternalId}
          user={editUser.data ?? undefined}
          onSubmitted={() => editUser.setOpen(false)}
        />
      </ResponsiveDialog>
      {updateRole.data && (
        <ResponsiveDialog
          title={updateRole.data?.roleName ? "Change Role" : "Assign Role"}
          open={updateRole.open}
          onOpenChange={updateRole.setOpen}
        >
          <UpdateUserRoleForm
            user={updateRole.data}
            clientId={clientId}
            onSubmitted={() => updateRole.setOpen(false)}
          />
        </ResponsiveDialog>
      )}
    </>
  );
}
