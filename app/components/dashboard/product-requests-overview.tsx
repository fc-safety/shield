import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { ProductRequest, ResultsPage } from "~/lib/models";
import { DataTable } from "../data-table/data-table";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import DisplayRelativeDate from "../display-relative-date";
import Icon from "../icons/icon";
import BlankDashboardTile from "./blank-dashboard-tile";
import ErrorDashboardTile from "./error-dashboard-tile";

export default function ProductRequestsOverview() {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error } = useQuery({
    queryKey: ["product-requests"],
    queryFn: () => getProductRequests(fetch),
  });

  return data ? (
    <Card>
      <CardHeader>Supply Requests</CardHeader>
      <CardContent>
        <DataTable
          columns={[
            {
              accessorKey: "createdOn",
              id: "orderedOn",
              header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table} />
              ),
              cell: ({ getValue }) => (
                <DisplayRelativeDate date={getValue() as string} />
              ),
            },
            {
              accessorKey: "status",
              id: "status",
              header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table} />
              ),
            },
            {
              accessorKey: "asset.name",
              id: "asset",
              header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table} />
              ),
              cell: ({ row, getValue }) => {
                const assetName = getValue() as string;
                return (
                  <span className="flex items-center gap-2">
                    {row.original.asset?.product?.productCategory?.icon && (
                      <Icon
                        iconId={row.original.asset.product.productCategory.icon}
                        color={row.original.asset.product.productCategory.color}
                        className="text-lg"
                      />
                    )}
                    {assetName}
                  </span>
                );
              },
            },
            {
              accessorFn: (request) =>
                request.productRequestApprovals?.length ?? 0,
              id: "approvals",
              header: ({ column, table }) => (
                <DataTableColumnHeader column={column} table={table} />
              ),
            },
          ]}
          initialState={{
            sorting: [{ id: "orderedOn", desc: true }],
          }}
          data={data.results}
        />
      </CardContent>
    </Card>
  ) : error ? (
    <ErrorDashboardTile />
  ) : (
    <BlankDashboardTile className="animate-pulse" />
  );
}

const getProductRequests = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const response = await fetch("/order-requests", {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<ProductRequest>>;
};
