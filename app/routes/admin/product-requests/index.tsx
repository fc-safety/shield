import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  ChevronDown,
  CornerDownRight,
  MoreHorizontal,
  Package,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { ProductRequestStatusBadge } from "~/components/assets/product-request-status-badge";
import { getSelectColumn } from "~/components/data-table/columns";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import DisplayRelativeDate from "~/components/display-relative-date";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DialogFooter } from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import {
  ProductRequestStatuses,
  type ProductRequest,
  type ProductRequestItem,
  type ProductRequestStatus,
} from "~/lib/models";
import { updateProductRequestSchema } from "~/lib/schema";
import { humanize } from "~/lib/utils";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
  return api.productRequests.list(
    request,
    {
      limit: 10000,
    },
    { context: "admin" }
  );
}

export default function AdminProductRequestsIndex({
  loaderData: productRequests,
}: Route.ComponentProps) {
  const updateStatus = useOpenData<ProductRequest[]>();

  const columns = useMemo(
    (): ColumnDef<ProductRequest>[] => [
      getSelectColumn<ProductRequest>(),
      {
        accessorKey: "createdOn",
        id: "orderedOn",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => <DisplayRelativeDate date={getValue() as string} />,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => (
          <ProductRequestStatusBadge status={getValue() as ProductRequestStatus} />
        ),
      },
      {
        accessorKey: "asset.product.name",
        id: "asset",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "productRequestItems",
        header: "Items",
        cell: ({ getValue }) => {
          const items = getValue() as ProductRequestItem[];
          return items.length > 0 ? (
            <ul>
              {items.slice(0, MAX_ITEMS_DISPLAY).map((item) => (
                <li key={item.id} className="flex justify-between gap-x-2 pr-2">
                  {item.product.name}
                  <span className="font-semibold">x{item.quantity}</span>
                </li>
              ))}
              {items.length > MAX_ITEMS_DISPLAY && (
                <li className="text-muted-foreground italic">
                  + {items.length - MAX_ITEMS_DISPLAY} items
                </li>
              )}
            </ul>
          ) : (
            <span className="italic">No items.</span>
          );
        },
      },
      {
        accessorFn: (request) => `${request.requestor.firstName} ${request.requestor.lastName}`,
        id: "requestor",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "client.name",
        id: "client",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "site.name",
        id: "site",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const request = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                <DropdownMenuItem asChild>
                  <Link to={request.id}>
                    <CornerDownRight />
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => updateStatus.openData([request])}
                  disabled={["COMPLETE", "CANCELLED"].includes(request.status)}
                >
                  <RefreshCw />
                  Update Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [updateStatus]
  );
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Package /> Supply Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={productRequests.results}
            initialState={{
              sorting: [{ id: "orderedOn", desc: true }],
            }}
            filters={({ table }) => [
              {
                column: table.getColumn("status"),
                options: ProductRequestStatuses.map((status) => ({
                  label: humanize(status),
                  value: status,
                })),
                title: "Status",
              },
            ]}
            actions={({ table }) => [
              <DropdownMenu key="bulk-actions">
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
                  >
                    Actions ({table.getSelectedRowModel().rows.length})
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() =>
                      updateStatus.openData(
                        table.getSelectedRowModel().rows.map((row) => row.original)
                      )
                    }
                  >
                    <RefreshCw />
                    Update Statuses
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>,
            ]}
          />
        </CardContent>
      </Card>
      <UpdateStatusDialog openData={updateStatus} />
    </>
  );
}

const MAX_ITEMS_DISPLAY = 3;

type TUpdateStatusesForm = z.infer<typeof updateProductRequestSchema>;

function UpdateStatusDialog({
  openData: updateStatus,
}: {
  openData: ReturnType<typeof useOpenData<ProductRequest[]>>;
}) {
  return (
    <ResponsiveDialog
      open={updateStatus.open}
      onOpenChange={updateStatus.setOpen}
      title={`Update ${
        updateStatus.data && updateStatus.data.length === 1
          ? "Status"
          : `Statuses (${updateStatus.data?.length || 0})`
      }`}
      description={`Update the status of ${
        updateStatus.data && updateStatus.data.length === 1
          ? "the selected order request"
          : "the selected order requests"
      }.`}
      render={({ isDesktop }) => (
        <UpdateStatusForm
          isDesktop={isDesktop}
          productRequests={updateStatus.data || []}
          onSubmitted={updateStatus.close}
        />
      )}
    />
  );
}

function UpdateStatusForm({
  onSubmitted,
  isDesktop,
  productRequests,
}: {
  onSubmitted: () => void;
  isDesktop: boolean;
  productRequests: ProductRequest[];
}) {
  const form = useForm<TUpdateStatusesForm>({
    defaultValues: {
      ids:
        productRequests
          .filter((r) => !["COMPLETE", "CANCELLED"].includes(r.status))
          .map((request) => request.id) || [],
    },
    resolver: zodResolver(updateProductRequestSchema),
  });

  const {
    formState: { isValid },
  } = form;

  const nonupdatableRequests = productRequests.filter((r) =>
    ["COMPLETE", "CANCELLED"].includes(r.status)
  );

  const { submitJson, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const submitButton = (
    <Button type="submit" disabled={isSubmitting || !isValid}>
      {isSubmitting ? "Updating..." : "Update"}
    </Button>
  );

  const handleSubmit = (data: TUpdateStatusesForm) => {
    submitJson(data, {
      method: "patch",
      path: "/api/proxy/product-requests/statuses?_throw=false",
      viewContext: "admin",
    });
  };

  return (
    <Form {...form}>
      <form className="mt-4 flex flex-col gap-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        {nonupdatableRequests.length > 0 && (
          <Alert variant="default">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Status will not be updated for {nonupdatableRequests.length}{" "}
              {nonupdatableRequests.length === 1
                ? "request because the request is complete or cancelled."
                : "requests because these requests are complete or cancelled."}
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select {...field} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ValidUpdateStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {humanize(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isDesktop ? <DialogFooter>{submitButton}</DialogFooter> : submitButton}
      </form>
    </Form>
  );
}

const ValidUpdateStatuses: ProductRequestStatus[] = ["PROCESSING", "FULFILLED", "COMPLETE"];
