import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import LinkPreview from "~/components/link-preview";
import NewManufacturerButton from "~/components/products/new-manufacturer-button";
import type { Manufacturer } from "~/lib/models";
import {
  createManufacturerSchemaResolver,
  type createManufacturerSchema,
} from "~/lib/schema";
import type { Route } from "./+types/index";

export const action = async ({ request }: Route.ActionArgs) => {
  const { data, errors } = await getValidatedFormData<
    z.infer<typeof createManufacturerSchema>
  >(request, createManufacturerSchemaResolver);

  if (errors) {
    throw Response.json({ errors }, { status: 400 });
  }

  return api.manufacturers.create(request, data);
};

export function loader({ request }: Route.LoaderArgs) {
  return api.manufacturers.list(request, { limit: 10000 });
}

export default function ProductManufacturers({
  loaderData: manufacturers,
}: Route.ComponentProps) {
  const columns: ColumnDef<Manufacturer>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="hover:underline">
            {getValue() as string}
          </Link>
        ),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
      },
      {
        accessorKey: "homeUrl",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Home URL" />
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value ? (
            <LinkPreview url={value} className="line-clamp-2" />
          ) : (
            <>&mdash;</>
          );
        },
      },
    ],
    []
  );
  return (
    <>
      <DataTable
        columns={columns}
        data={manufacturers.results}
        searchPlaceholder="Search manufacturers..."
        actions={[<NewManufacturerButton key="add" />]}
      />
    </>
  );
}
