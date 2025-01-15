import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import NewProductCategoryButton from "~/components/products/new-product-category-button";
import type { ProductCategory } from "~/lib/models";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
  return api.productCategories.list(request, { limit: 10000 });
}

export default function ProductCategories({
  loaderData: productCategories,
}: Route.ComponentProps) {
  const columns: ColumnDef<ProductCategory>[] = useMemo(
    () => [
      {
        accessorKey: "active",
        header: ({ column }) => <DataTableColumnHeader column={column} />,
        cell: ({ getValue }) => <ActiveIndicator2 active={!!getValue()} />,
      },
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
        accessorKey: "shortName",
        id: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ getValue }) => (
          <span className="line-clamp-2">
            {(getValue() as string) || <>&mdash;</>}
          </span>
        ),
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
        actions={[<NewProductCategoryButton key="add" />]}
      />
    </>
  );
}
