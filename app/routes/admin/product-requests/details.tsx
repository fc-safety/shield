import { api } from "~/.server/api";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { AnsiCategoryDisplay } from "~/components/products/ansi-category-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getUserDisplayName } from "~/lib/users";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: () => ({
    label: "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export function loader({ request, params }: Route.LoaderArgs) {
  const id = validateParam(params, "id");
  return api.productRequests.get(request, id);
}

export default function AdminProductRequestsDetails({
  loaderData: productRequest,
}: Route.ComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply Request Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        <DataList
          title="Overview"
          details={[
            {
              label: "Status",
              value: productRequest.status,
            },
            {
              label: "Client",
              value: productRequest.client?.name,
            },
            {
              label: "Site",
              value: productRequest.site?.name,
            },
            {
              label: "Requestor",
              value: getUserDisplayName(productRequest.requestor),
            },
            {
              label: "Asset",
              value: productRequest.asset?.name,
            },
          ]}
          defaultValue={<>&mdash;</>}
        />

        <DataTable
          columns={[
            {
              header: "Product",
              accessorKey: "product.name",
            },
            {
              header: "Quantity",
              accessorKey: "quantity",
            },
            {
              header: "ANSI",
              id: "ansi",
              accessorKey: "product.ansiCategory.name",
              cell: ({ row }) =>
                row.original.product.ansiCategory ? (
                  <AnsiCategoryDisplay
                    ansiCategory={row.original.product.ansiCategory}
                  />
                ) : (
                  <>&mdash;</>
                ),
            },
          ]}
          initialState={{
            columnVisibility: {
              ansi: productRequest.productRequestItems.some(
                (item) => item.product.ansiCategory
              ),
            },
          }}
          data={productRequest.productRequestItems}
        />
      </CardContent>
    </Card>
  );
}
