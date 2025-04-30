import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Link } from "react-router";
import { FetchOptions, getAuthenticatedData } from "~/.server/api-utils";
import { guardOrSendHome } from "~/.server/guard";
import EditRoleButton from "~/components/admin/edit-role-button";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Role } from "~/lib/types";
import { isGlobalAdmin } from "~/lib/users";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guardOrSendHome(request, (user) => isGlobalAdmin(user));

  return getAuthenticatedData<Role[]>(request, [
    FetchOptions.url("/roles").get().build(),
  ]);
};

export default function AdminRoles({
  loaderData: roles,
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Users /> Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RolesTable roles={roles} />
        </CardContent>
      </Card>
    </div>
  );
}

const roleColumns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} table={table} />
    ),
    cell: ({ getValue, row }) => (
      <Link to={row.original.id} className="hover:underline">
        {getValue() as string}
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} table={table} />
    ),
    cell: ({ getValue }) => (getValue() as string) || <>&mdash;</>,
  },
  {
    accessorFn: (role) => {
      const p = role.permissions.find((p) => p.startsWith("visibility"));
      return p ? p.replace("visibility:", "") : "self";
    },
    id: "visibility",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} table={table} />
    ),
    cell: ({ getValue }) => (
      <span className="capitalize">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ getValue }) => {
      const permissions = (getValue() as string[]).filter(
        (p) => !p.startsWith("visibility")
      );
      return permissions.length > 0 ? (
        <ul>
          {permissions.slice(0, MAX_PERMISSIONS_DISPLAY).map((permission) => (
            <li key={permission} className="capitalize">
              {formatActionPermission(permission)}
            </li>
          ))}
          {permissions.length > MAX_PERMISSIONS_DISPLAY && (
            <li className="text-muted-foreground italic">
              + {permissions.length - MAX_PERMISSIONS_DISPLAY} permissions
            </li>
          )}
        </ul>
      ) : (
        <span className="italic">No permissions set.</span>
      );
    },
  },
  {
    id: "details",
    cell: ({ row }) => (
      <Button variant="secondary" size="sm" type="button" asChild>
        <Link to={row.original.id}>Details</Link>
      </Button>
    ),
  },
];

function RolesTable({ roles }: { roles: Role[] }) {
  return (
    <>
      <DataTable
        data={roles}
        columns={roleColumns}
        searchPlaceholder="Search roles..."
        actions={[<EditRoleButton key="add" />]}
      />
    </>
  );
}

const formatActionPermission = (p: string) => {
  if (p.includes(":")) {
    const [action, resource] = p.split(":");
    return `${action} ${resource}`;
  }
  return p;
};

const MAX_PERMISSIONS_DISPLAY = 3;
