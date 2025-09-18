import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import {
  Check,
  ChevronsUpDown,
  Clock,
  LayoutDashboard,
  List,
  MinusCircle,
  Package,
  PackageCheck,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAppState, useAppStateValue } from "~/contexts/app-state-context";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useOpenData } from "~/hooks/use-open-data";
import { type ProductRequest, type ProductRequestStatus, type ResultsPage } from "~/lib/models";
import { stringifyQuery, type QueryParams } from "~/lib/urls";
import { can, getUserDisplayName, hasMultiSiteVisibility } from "~/lib/users";
import { cn, humanize } from "~/lib/utils";
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
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "./components/dashboard-card";
import ErrorOverlay from "./components/error-overlay";
import LoadingOverlay from "./components/loading-overlay";

export default function ProductRequestsOverview({ refreshKey }: { refreshKey: number }) {
  const { appState, setAppState } = useAppState();
  const [sorting, setSorting] = useAppStateValue("dash_pr_sort", [{ id: "orderedOn", desc: true }]);
  const [view, setView] = useAppStateValue("dash_pr_view", "summary");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const productRequestsQuery = useMemo(() => {
    return (
      appState.dash_pr_query ?? {
        createdOn: {
          gte: startOfDay(subDays(new Date(), 30)).toISOString(),
          lte: endOfDay(new Date()).toISOString(),
        },
      }
    );
  }, [appState.dash_pr_query]);

  const handleSetProductRequestsQuery = (
    newProductRequestsQuery: typeof productRequestsQuery,
    quickRangeId?: QuickRangeId
  ) => {
    setAppState({
      dash_pr_query: newProductRequestsQuery,
      dash_pr_quickRangeId: quickRangeId,
    });
  };

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          <Package /> Recent Supply Requests
          <div className="flex-1"></div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(value) => {
              setView(value as "summary" | "details");
            }}
          >
            <ToggleGroupItem value="summary">
              <LayoutDashboard />
            </ToggleGroupItem>
            <ToggleGroupItem value="details">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
          {/* <Button variant="outline" size="iconSm">
            <Printer />
          </Button> */}
        </DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="flex min-h-0 flex-1 flex-col space-y-4 rounded-[inherit] bg-inherit">
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DateRangeSelect
            iconOnly
            quickRangeId={appState.dash_pr_quickRangeId}
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
              handleSetProductRequestsQuery(newProductRequestsQuery, quickRangeId);
            }}
            defaultQuickRangeId={appState.dash_pr_quickRangeId ?? "last-30-days"}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn(view === "summary" && "hidden")}>
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
                    setSorting([sort]);
                  }}
                >
                  <Check
                    className={cn(
                      "opacity-0",
                      sorting.some((s) => s.id === sort.id && s.desc === sort.desc) && "opacity-100"
                    )}
                  />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {view === "summary" ? (
          <ProductRequestsSummary
            refreshKey={refreshKey}
            queryParams={productRequestsQuery}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        ) : (
          <ProductRequestsDetails
            refreshKey={refreshKey}
            queryParams={productRequestsQuery}
            sorting={sorting}
            setSorting={setSorting}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        )}
      </DashboardCardContent>
      {isLoading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay>Error occurred while loading product requests.</ErrorOverlay>
      ) : null}
    </DashboardCard>
  );
}

function ProductRequestsSummary({
  refreshKey,
  queryParams,
  setIsLoading,
  setError,
}: {
  refreshKey: number;
  queryParams: QueryParams;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}) {
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error, isLoading } = useQuery({
    queryKey: ["product-requests", queryParams, refreshKey] as const,
    queryFn: ({ queryKey }) => getProductRequests(fetch, queryKey[1]),
  });

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    setError(error);
  }, [error, setError]);

  const productRequests = useMemo(() => data?.results ?? [], [data]);

  const productRequestsCounts = useMemo(() => {
    return DISPLAY_STATUSES.map(({ status, icon }) => ({
      status,
      icon,
      count: productRequests.filter((request) => request.status === status).length,
    }));
  }, [productRequests]);

  return (
    <GradientScrollArea className="flex-1" variant="card">
      {productRequests.length === 0 && (
        <p className="text-muted-foreground mb-4 text-center text-sm italic">
          There are no supply requests to display.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {productRequestsCounts.map(({ status, icon: Icon, count }) => (
          <div key={status} className={cn("flex items-center gap-4 rounded-lg")}>
            <ProductRequestStatusBadge
              status={status}
              className="flex size-10 shrink-0 items-center justify-center p-2"
            >
              <Icon className="size-5" />
            </ProductRequestStatusBadge>
            <div className="flex items-center gap-x-2 text-sm sm:text-base">
              <h5
                className={cn({
                  "font-semibold": count > 0,
                })}
              >
                {humanize(status)}
              </h5>
              {count > 0 ? (
                <h6 className="text-muted-foreground">
                  ({((count / productRequests.length) * 100).toFixed(0)}% )
                </h6>
              ) : null}
            </div>
            <div className="flex-1"></div>
            <h5
              className={cn("leading-tight", {
                "font-bold": count > 0,
              })}
            >
              {count > 0 ? count : <>&mdash;</>}
            </h5>
          </div>
        ))}
      </div>
    </GradientScrollArea>
  );
}

function ProductRequestsDetails({
  refreshKey,
  queryParams,
  sorting,
  setSorting,
  setIsLoading,
  setError,
}: {
  refreshKey: number;
  queryParams: QueryParams;
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}) {
  const { user } = useAuth();
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error, isLoading } = useQuery({
    queryKey: ["product-requests", queryParams, refreshKey] as const,
    queryFn: ({ queryKey }) => getProductRequests(fetch, queryKey[1]),
  });

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    setError(error);
  }, [error, setError]);

  const reviewRequest = useOpenData<ProductRequest>();

  const columns = useMemo(
    (): ColumnDef<ProductRequest>[] => [
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
        accessorKey: "asset.name",
        id: "asset",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row, getValue }) => {
          const assetName = getValue() as string;
          return (
            <Link
              to={row.original.asset ? `/assets/${row.original.asset.id}` : "#"}
              className="group flex items-center gap-2"
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
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorKey: "productRequestItems",
        id: "items",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row }) => {
          const items = row.original.productRequestItems;
          return (
            <span>
              {items.slice(0, MAX_ITEMS_IN_SUMMARY).map((i, idx) => (
                <span key={i.id}>
                  {idx > 0 && ", "}
                  <span className="font-bold">{i.quantity}x</span> {i.product?.name}
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
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
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
              className="text-xs font-semibold underline"
            >
              more
            </button>
          );
        },
      },
    ],
    [reviewRequest]
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

  const { rows } = table.getRowModel();
  const isEmpty = !rows.length;

  return (
    <>
      <GradientScrollArea className="flex-1" variant="card">
        {!isLoading && isEmpty ? (
          <p className="text-muted-foreground border-border border-t py-4 text-center text-sm">
            No supply requests to display.
          </p>
        ) : null}
        {rows.map((row) => {
          const productRequest = row.original;
          const cells = row.getVisibleCells().reduce(
            (acc, cell) => {
              acc[String(cell.column.id)] = cell;
              return acc;
            },
            {} as Record<string, Cell<ProductRequest, unknown>>
          );

          return (
            <div
              key={productRequest.id}
              className="border-border flex flex-col gap-2 border-t py-2"
            >
              <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                {format(productRequest.createdOn, "PPpp")}
                {renderCell(cells.status)}
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  {cells.site ? (
                    <span className="font-semibold">[{renderCell(cells.site)}]</span>
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
      <ReviewProductRequestModal
        open={reviewRequest.open}
        onOpenChange={reviewRequest.setOpen}
        request={reviewRequest.data}
      />
    </>
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
        trigger={<button className="hidden"></button>}
      >
        <>
          <div className="flex flex-col gap-4 py-4">
            <DataList
              details={[
                {
                  label: "Requestor",
                  value: request?.requestor && getUserDisplayName(request?.requestor),
                },
                {
                  label: "Site",
                  value: request?.site?.name,
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
            {request ? <ProductRequestCard request={request} /> : <p>No request selected</p>}
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

const DISPLAY_STATUSES: {
  status: ProductRequestStatus;
  icon: LucideIcon;
}[] = [
  {
    status: "NEW",
    icon: Star,
  },
  {
    status: "PROCESSING",
    icon: Clock,
  },
  {
    status: "FULFILLED",
    icon: PackageCheck,
  },
  {
    status: "COMPLETE",
    icon: Check,
  },
  {
    status: "CANCELLED",
    icon: MinusCircle,
  },
];

const renderCell = (cell: Cell<ProductRequest, unknown> | undefined | null) =>
  cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
