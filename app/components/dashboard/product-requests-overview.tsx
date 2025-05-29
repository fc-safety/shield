import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format, subDays } from "date-fns";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useImmer } from "use-immer";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAppState } from "~/contexts/app-state-context";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useOpenData } from "~/hooks/use-open-data";
import type {
  ProductRequest,
  ProductRequestStatus,
  ResultsPage,
} from "~/lib/models";
import { stringifyQuery, type QueryParams } from "~/lib/urls";
import { can, getUserDisplayName, hasMultiSiteVisibility } from "~/lib/users";
import { cn } from "~/lib/utils";
import { ProductRequestStatusBadge } from "../assets/product-request-status-badge";
import { ProductRequestCard } from "../assets/product-requests";
import DataList from "../data-list";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import DateRangeSelect, { type QuickRangeId } from "../date-range-select";
import DisplayRelativeDate from "../display-relative-date";
import GradientScrollArea from "../gradient-scroll-area";
import Icon from "../icons/icon";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import ErrorDashboardTile from "./error-dashboard-tile";

export default function ProductRequestsOverview() {
  const { appState, setAppState } = useAppState();

  const { user } = useAuth();
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const [productRequestsQuery, setProductRequestsQuery] = useImmer(
    appState.dash_pr_query ?? {
      createdOn: {
        gte: subDays(new Date(), 30).toISOString(),
        lte: new Date().toISOString(),
      },
    }
  );

  const handleSetProductRequestsQuery = (
    newProductRequestsQuery: typeof productRequestsQuery,
    quickRangeId?: QuickRangeId
  ) => {
    setProductRequestsQuery(newProductRequestsQuery);
    setAppState({
      dash_pr_query: newProductRequestsQuery,
      dash_pr_quickRangeId: quickRangeId,
    });
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ["product-requests", productRequestsQuery] as const,
    queryFn: ({ queryKey }) => getProductRequests(fetch, queryKey[1]),
  });

  const reviewRequest = useOpenData<ProductRequest>();

  const columns = useMemo(
    (): ColumnDef<ProductRequest>[] => [
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
        cell: ({ getValue }) => (
          <ProductRequestStatusBadge
            status={getValue() as ProductRequestStatus}
          />
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
            <Link
              to={row.original.asset ? `/assets/${row.original.asset.id}` : "#"}
              className="flex items-center gap-2 group"
            >
              <span className="group-hover:underline">{assetName}</span>
              {row.original.asset?.product?.productCategory?.icon && (
                <Icon
                  iconId={row.original.asset.product.productCategory.icon}
                  color={row.original.asset.product.productCategory.color}
                  className="text-lg"
                />
              )}
            </Link>
          );
        },
      },
      {
        accessorKey: "site.name",
        id: "site",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorKey: "productRequestItems",
        id: "items",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row }) => {
          const items = row.original.productRequestItems;
          return (
            <span>
              {items.slice(0, MAX_ITEMS_IN_SUMMARY).map((i, idx) => (
                <span key={i.id}>
                  {idx > 0 && ", "}
                  <span className="font-bold">{i.quantity}x</span>{" "}
                  {i.product?.name}
                </span>
              ))}
              {items.length > MAX_ITEMS_IN_SUMMARY && (
                <>
                  ,{" "}
                  <span className="text-muted-foreground italic">
                    + {items.length - MAX_ITEMS_IN_SUMMARY} more
                  </span>
                </>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "requestor",
        id: "requestor",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ row }) => {
          const requestor = row.original.requestor;
          return getUserDisplayName(requestor);
        },
      },
      // TODO: Holding off on in-app product request interactions. Product requests for
      // now are read-only.
      // {
      //   accessorFn: (request) =>
      //     request.productRequestApprovals?.length ?? 0,
      //   id: "reviews",
      //   header: ({ column, table }) => (
      //     <DataTableColumnHeader column={column} table={table} />
      //   ),
      //   cell: ({ row }) => {
      //     const request = row.original;
      //     return (
      //       <ProductRequestApprovalsDisplay
      //         approvals={request.productRequestApprovals ?? []}
      //       />
      //     );
      //   },
      // },
      // {
      //   id: "review",
      //   cell: ({ row }) => {
      //     const request = row.original;
      //     const myApproval = request.productRequestApprovals?.find(
      //       (a) => a.approver?.idpId === user?.idpId
      //     );
      //     return (
      //       <Button
      //         variant={
      //           !myApproval
      //             ? "secondary"
      //             : myApproval.approved
      //             ? "default"
      //             : "destructive"
      //         }
      //         disabled={!!myApproval}
      //         size="sm"
      //         onClick={() => reviewRequest.openData(request)}
      //       >
      //         {!myApproval
      //           ? "Review"
      //           : myApproval.approved
      //           ? "Approved"
      //           : "Rejected"}
      //       </Button>
      //     );
      //   },
      // },
      {
        id: "details",
        cell: ({ row }) => {
          const request = row.original;
          return (
            <button
              type="button"
              onClick={() => reviewRequest.openData(request)}
              className="underline text-xs font-semibold"
            >
              more
            </button>
          );
        },
      },
    ],
    [reviewRequest]
  );

  const [sorting, setSorting] = useState<SortingState>(
    appState.dash_pr_sort ?? [{ id: "orderedOn", desc: true }]
  );

  const productRequests = useMemo(() => data?.results ?? [], [data]);
  const table = useReactTable({
    data: productRequests,
    columns,
    initialState: {
      columnVisibility: {
        site: hasMultiSiteVisibility(user),
        review: can(user, "review", "product-requests"),
      },
    },
    state: {
      sorting,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleSortingChange = (sorting: SortingState) => {
    table.setSorting(sorting);
    setAppState({
      dash_pr_sort: sorting,
    });
  };

  const { rows } = table.getRowModel();
  const isEmpty = !rows.length;

  return error ? (
    <ErrorDashboardTile />
  ) : (
    <div>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            <Package /> Recent Supply Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-inherit space-y-4 rounded-[inherit]">
          {/* <VirtualizedDataTable
            height="100%"
            maxHeight={400}
            columns={columns}
            initialState={{
              sorting: [{ id: "orderedOn", desc: true }],
              columnVisibility: {
                site: hasMultiSiteVisibility(user),
                review: can(user, "review", "product-requests"),
              },
            }}
            data={data?.results ?? []}
            loading={isLoading}
          /> */}
          <div className="flex gap-2 flex-wrap items-center justify-between">
            <DateRangeSelect
              value={
                productRequestsQuery.createdOn?.gte
                  ? {
                      from: productRequestsQuery.createdOn?.gte,
                      to: productRequestsQuery.createdOn?.lte,
                    }
                  : undefined
              }
              onValueChange={(dateRange, quickRangeId) => {
                if (!dateRange) {
                  return;
                }

                const newProductRequestsQuery = dateRange
                  ? {
                      ...productRequestsQuery,
                      createdOn: {
                        gte: dateRange.from,
                        lte: dateRange.to,
                      },
                    }
                  : productRequestsQuery;
                handleSetProductRequestsQuery(
                  newProductRequestsQuery,
                  quickRangeId
                );
              }}
              defaultQuickRangeId={
                appState.dash_pr_quickRangeId ?? "last-30-days"
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort by
                  <ChevronsUpDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[
                  {
                    id: "newestFirst",
                    sort: { id: "orderedOn", desc: true },
                    label: "Newest first",
                  },
                  {
                    id: "oldestFirst",
                    sort: { id: "orderedOn", desc: false },
                    label: "Oldest first",
                  },
                ].map(({ id, sort, label }) => (
                  <DropdownMenuItem
                    key={id}
                    onSelect={() => {
                      handleSortingChange([sort]);
                    }}
                  >
                    <Check
                      className={cn(
                        "opacity-0",
                        sorting.some(
                          (s) => s.id === sort.id && s.desc === sort.desc
                        ) && "opacity-100"
                      )}
                    />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <GradientScrollArea className="h-[300px]" variant="card">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : isEmpty ? (
              <p className="text-center text-sm text-muted-foreground py-4 border-t border-border">
                No supply requests to display.
              </p>
            ) : null}
            {rows.map((row) => {
              const productRequest = row.original;
              const cells = row.getVisibleCells().reduce((acc, cell) => {
                acc[String(cell.column.id)] = cell;
                return acc;
              }, {} as Record<string, Cell<ProductRequest, unknown>>);

              return (
                <div
                  key={productRequest.id}
                  className="py-2 flex flex-col gap-2 border-t border-border"
                >
                  <div className="flex items-center gap-2 justify-between text-xs text-muted-foreground">
                    {format(productRequest.createdOn, "PPpp")}
                    {renderCell(cells.status)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      {cells.site ? (
                        <span className="font-semibold">
                          [{renderCell(cells.site)}]
                        </span>
                      ) : (
                        ""
                      )}{" "}
                      {renderCell(cells.requestor)} requested these supplies{" "}
                      {renderCell(cells.orderedOn)}:
                    </p>
                    <p className="text-sm">{renderCell(cells.items)}</p>
                  </div>
                  <div className="flex">{renderCell(cells.details)}</div>
                </div>
              );
            })}
          </GradientScrollArea>
        </CardContent>
      </Card>
      <ReviewProductRequestModal
        open={reviewRequest.open}
        onOpenChange={reviewRequest.setOpen}
        request={reviewRequest.data}
      />
    </div>
  );
}

const getProductRequests = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>,
  queryParams: QueryParams
) => {
  const qs = stringifyQuery({
    ...queryParams,
    limit: 10000,
  });
  const response = await fetch(`/product-requests?${qs}`, {
    method: "GET",
  });

  return response.json() as Promise<ResultsPage<ProductRequest>>;
};

// const reviewProductRequest = async (
//   fetch: (url: string, options: RequestInit) => Promise<Response>,
//   requestId: string,
//   approved: boolean
// ) => {
//   const response = await fetch(`/product-requests/${requestId}/review`, {
//     method: "PATCH",
//     body: JSON.stringify({
//       productRequestApprovals: {
//         create: {
//           approved,
//         },
//       },
//     }),
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   return response.json();
// };

function ReviewProductRequestModal({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ProductRequest | null;
}) {
  // const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  // const queryClient = useQueryClient();
  // const { mutate: doReview, isPending: isSubmittingReview } = useMutation({
  //   mutationFn: ({
  //     requestId,
  //     approved,
  //   }: {
  //     requestId: string;
  //     approved: boolean;
  //   }) => reviewProductRequest(fetch, requestId, approved),
  //   onSuccess: () => {
  //     onOpenChange(false);
  //     queryClient.invalidateQueries({ queryKey: ["product-requests"] });
  //   },
  // });

  // const [confirmAction, setConfirmAction] = useConfirmAction();

  // const handleReview = (approved: boolean) => {
  //   if (!request?.id) {
  //     return;
  //   }

  //   setConfirmAction((draft) => {
  //     draft.open = true;
  //     draft.onConfirm = () => {
  //       doReview({
  //         requestId: request.id,
  //         approved,
  //       });
  //     };
  //     draft.title = `${approved ? "Approve" : "Reject"} this product request?`;
  //     draft.destructive = !approved;
  //     draft.confirmText = approved ? "Approve" : "Reject";
  //   });
  // };

  return (
    <>
      <ResponsiveDialog
        title="Supply Request Details"
        open={open}
        onOpenChange={onOpenChange}
        dialogClassName="sm:max-w-lg"
        trigger={null}
      >
        <>
          <div className="flex flex-col gap-4 py-4">
            <DataList
              details={[
                {
                  label: "Requestor",
                  value:
                    request?.requestor &&
                    getUserDisplayName(request?.requestor),
                },
                {
                  label: "Site",
                  value: request?.site?.name,
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
            {request ? (
              <ProductRequestCard request={request} />
            ) : (
              <p>No request selected</p>
            )}
          </div>
          <DialogFooter className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {/* Close */}
              Done
            </Button>
            {/* <div className="flex-1"></div> */}
            {/* <Button
              variant="destructive"
              disabled={isSubmittingReview}
              onClick={() => handleReview(false)}
            >
              Reject
            </Button>
            <Button
              variant="default"
              disabled={isSubmittingReview}
              onClick={() => handleReview(true)}
            >
              Approve
            </Button> */}
          </DialogFooter>
        </>
      </ResponsiveDialog>
      {/* <ConfirmationDialog {...confirmAction} /> */}
    </>
  );
}

const MAX_ITEMS_IN_SUMMARY = 5;

const renderCell = (cell: Cell<ProductRequest, unknown> | undefined | null) =>
  cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
