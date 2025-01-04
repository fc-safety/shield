import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { getManufacturers } from "~/.server/api";
import { DataTable } from "~/components/data-table/data-table";
import type { Manufacturer } from "~/lib/models";
import type { Route } from "./+types/manufacturers";

export const handle = {
  breadcrumb: () => ({
    label: "Manufacturers",
  }),
};

export function loader({ request }: Route.LoaderArgs) {
  return getManufacturers(request, { limit: 10000 });
}

export default function AdminCategories({
  loaderData: manufacturers,
}: Route.ComponentProps) {
  const columns: ColumnDef<Manufacturer>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
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
        // actions={[<NewManufacturerButton key="add" />]}
      />
    </>
  );
}
