import type { ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";
import { useMemo } from "react";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ProductRequest } from "~/lib/models";

export default function AdminOrderRequestsIndex() {
  const columns = useMemo(
    (): ColumnDef<ProductRequest>[] => [
      {
        accessorKey: "createdOn",
        id: "created",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "requestor.name",
        id: "requestor",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "client.name",
        id: "client",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "site.name",
        id: "site",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
    ],
    []
  );
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Package /> Order Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={[]} />
        </CardContent>
      </Card>
    </>
  );
}
