import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Copy, Nfc } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "~/.server/api";
import { APP_HOST } from "~/.server/config";
import NewTagButton from "~/components/assets/edit-tag-button";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Tag } from "~/lib/models";
import { buildUrl } from "~/lib/urls";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
  return api.tags.list(request, { limit: 10000 }).mapTo((tags) => ({
    tags,
    appHost: APP_HOST,
  }));
}

export default function AdminTagsIndex({
  loaderData: { tags, appHost },
}: Route.ComponentProps) {
  const copyUrlForTagExternalId = useCallback(
    (extId: string) => {
      const url = buildUrl("/inspect", appHost, {
        extId,
      });
      navigator.clipboard.writeText(url.toString()).then(() => {
        toast.success("Copied inspection URL to clipboard!");
      });
    },
    [appHost]
  );

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
      {
        accessorKey: "externalId",
        id: "inspection link",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue, row }) => {
          const tag = row.original;
          return (
            <Button
              variant="secondary"
              size="sm"
              disabled={!tag.asset}
              onClick={() => copyUrlForTagExternalId(getValue() as string)}
              title={tag.asset ? "Copy inspection link" : "No asset assigned"}
            >
              <Copy />
              Copy
            </Button>
          );
        },
      },
    ],
    [copyUrlForTagExternalId]
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
