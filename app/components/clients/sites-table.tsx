import type { ColumnDef } from "@tanstack/react-table";
import { PhoneCall, Star } from "lucide-react";
import { Link, type To } from "react-router";
import type { Site } from "~/lib/models";
import { beautifyPhone } from "~/lib/utils";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import EditSiteButton from "./edit-site-button";

interface SitesTableProps {
  clientId: string;
  sites: Site[];
  parentSiteId?: string;
  buildToSite: (id: string) => To;
}

export default function SitesTable({
  sites,
  clientId,
  parentSiteId,
  buildToSite,
}: SitesTableProps) {
  const columns: ColumnDef<Site>[] = [
    {
      accessorKey: "name",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),

      cell: ({ row, getValue }) => (
        <Link
          to={buildToSite(row.original.id)}
          className="inline-flex items-center gap-1 hover:underline"
        >
          {getValue() as string}
          {row.original.primary && (
            <Star size={14} fill="currentColor" className="text-primary" />
          )}
        </Link>
      ),
    },
    {
      accessorFn: (data) => `${data.address.city}, ${data.address.state}`,
      id: "city",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),
    },
    {
      accessorFn: (data) => beautifyPhone(data.phoneNumber),
      id: "phone",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),

      cell: ({ row, getValue }) => (
        <HoverCard>
          <HoverCardTrigger>{getValue() as string}</HoverCardTrigger>
          <HoverCardContent>
            <Button variant="link" asChild>
              <a href={`tel:${row.original.phoneNumber}`}>
                <PhoneCall />
                Call {getValue() as string}
              </a>
            </Button>
          </HoverCardContent>
        </HoverCard>
      ),
    },
  ];
  return (
    <>
      <DataTable
        data={sites}
        columns={columns}
        searchPlaceholder="Search sites..."
        actions={[
          <EditSiteButton
            key="add"
            clientId={clientId}
            parentSiteId={parentSiteId}
            viewContext="admin"
          />,
        ]}
      />
    </>
  );
}
