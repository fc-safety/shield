import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Nfc } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import NewTagButton from "~/components/assets/edit-tag-button";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Tag } from "~/lib/models";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
  return api.tags.list(request, { limit: 10000 });
}

export default function AdminTagsIndex({
  loaderData: tags,
}: Route.ComponentProps) {
  const columns: ColumnDef<Tag>[] = useMemo(
    () => [
      {
        accessorKey: "serialNumber",
        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="hover:underline">
            {getValue() as string}
          </Link>
        ),
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "asset.name",
        id: "assigned asset",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorKey: "asset.setupOn",
        id: "setup on",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as Date;
          return value ? format(value, "PPpp") : <>&mdash;</>;
        },
      },
      {
        accessorKey: "client.name",
        id: "assigned client",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
      {
        accessorKey: "site.name",
        id: "assigned site",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => getValue() ?? <>&mdash;</>,
      },
    ],
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Nfc /> Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={tags.results}
          searchPlaceholder="Search tags..."
          actions={[<NewTagButton key="add" />]}
        />
      </CardContent>
    </Card>
  );
}
