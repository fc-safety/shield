import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { getProductCategories } from "~/.server/api";
import { DataTable } from "~/components/data-table/data-table";
import type { ProductCategory } from "~/lib/models";
import type { Route } from "./+types/categories";

export const handle = {
  breadcrumb: () => ({
    label: "Categories",
  }),
};

export function loader({ request }: Route.LoaderArgs) {
  return getProductCategories(request, { limit: 10000 });
}

export default function AdminCategories({
  loaderData: productCategories,
}: Route.ComponentProps) {
  const columns: ColumnDef<ProductCategory>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "shortName",
        id: "code",
        header: "Code",
      },
    ],
    []
  );
  return (
    <>
      <DataTable
        columns={columns}
        data={productCategories.results}
        searchPlaceholder="Search categories..."
        // actions={[<NewProductCategoryButton key="add" />]}
      />
    </>
  );
}
