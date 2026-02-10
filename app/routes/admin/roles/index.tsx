import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Link } from "react-router";
import { ApiFetcher } from "~/.server/api-utils";
import { guardOrSendHome } from "~/.server/guard";
import EditRoleButton from "~/components/admin/edit-role-button";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Role } from "~/lib/types";
import { isSystemsAdmin } from "~/lib/users";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guardOrSendHome(request, (user) => isSystemsAdmin(user));

  const roles = await ApiFetcher.create(request, "/roles").get<Role[]>();
  return roles;
};

export default function AdminRoles({ loaderData: roles }: Route.ComponentProps) {
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
    header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
    cell: ({ getValue, row }) => (
      <Link to={row.original.id} className="hover:underline">
        {getValue() as string}
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
    cell: ({ getValue }) => (getValue() as string) || <>&mdash;</>,
  },
  {
    accessorKey: "clientAssignable",
    header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
    cell: ({ getValue }) => ((getValue() as boolean) ? "Yes" : "No"),
  },
  {
    accessorKey: "scope",
    header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
    cell: ({ getValue }) => {
      const scope = getValue() as Role["scope"];
      return <span className="capitalize">{scope.toLowerCase()}</span>;
    },
  },
  {
    accessorKey: "capabilities",
    header: "Permissions",
    cell: ({ getValue }) => {
      const capabilities = getValue() as string[];
      return capabilities.length > 0 ? (
        <ul>
          {capabilities.slice(0, MAX_PERMISSIONS_DISPLAY).map((permission) => (
            <li key={permission} className="capitalize">
              {formatActionPermission(permission)}
            </li>
          ))}
          {capabilities.length > MAX_PERMISSIONS_DISPLAY && (
            <li className="text-muted-foreground italic">
              + {capabilities.length - MAX_PERMISSIONS_DISPLAY} permissions
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
  const formatted = p.replace(/[-_]/g, " ");
  if (formatted.includes(":")) {
    const [action, resource] = formatted.split(":");
    return `${action} ${resource}`;
  }
  return formatted;
};

const MAX_PERMISSIONS_DISPLAY = 3;
