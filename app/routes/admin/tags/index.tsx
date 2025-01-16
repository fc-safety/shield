import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo } from "react";
import { Link } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import NewTagButton from "~/components/assets/new-tag-button";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import type { Tag } from "~/lib/models";
import { createTagSchemaResolver, type createTagSchema } from "~/lib/schema";
import { getValidatedFormDataOrThrow } from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof createTagSchema>
  >(request, createTagSchemaResolver);

  return api.tags.create(request, data);
};

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
    ],
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={tags.results}
        searchPlaceholder="Search tags..."
        actions={[<NewTagButton key="add" />]}
      />
    </>
  );
}
