import type { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import type { Client, Site } from "~/lib/models";
import { can } from "~/lib/users";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import EditSiteButton from "./edit-site-button";

interface ClientSiteGroupsTableProps {
  clientId: string;
  siteGroups: Site[];
  buildToSiteGroup?: (id: string) => string;
}

export default function ClientSiteGroupsTable({
  siteGroups,
  clientId,
  buildToSiteGroup,
}: ClientSiteGroupsTableProps) {
  const { user } = useAuth();
  const canCreateSiteGroup = can(user, "create", "sites");

  const columns: ColumnDef<Exclude<Client["sites"], undefined>[number]>[] = [
    {
      accessorKey: "name",
      header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,

      cell: ({ row, getValue }) => (
        <Link
          to={buildToSiteGroup?.(row.original.id) ?? ""}
          className="inline-flex items-center gap-1 hover:underline"
        >
          {getValue() as string}
          {row.original.primary && <Star size={14} fill="currentColor" className="text-primary" />}
        </Link>
      ),
    },
    {
      accessorFn: (data) => data._count?.subsites ?? 0,
      id: "subsites",
      header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
    },
  ];
  return (
    <>
      <DataTable
        data={siteGroups}
        columns={columns}
        searchPlaceholder="Search site groups..."
        actions={[
          canCreateSiteGroup ? (
            <EditSiteButton key="add" clientId={clientId} isSiteGroup />
          ) : null,
        ]}
      />
    </>
  );
}
