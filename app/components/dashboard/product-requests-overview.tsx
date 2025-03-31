import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { subDays } from "date-fns";
import { useMemo } from "react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useOpenData } from "~/hooks/use-open-data";
import type { ProductRequest, ResultsPage } from "~/lib/models";
import { stringifyQuery } from "~/lib/urls";
import { can, getUserDisplayName } from "~/lib/users";
import { ProductRequestCard } from "../assets/product-requests";
import DataList from "../data-list";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import VirtualizedDataTable from "../data-table/virtualized-data-table";
import DisplayRelativeDate from "../display-relative-date";
import Icon from "../icons/icon";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import { DialogFooter } from "../ui/dialog";
import ErrorDashboardTile from "./error-dashboard-tile";

export default function ProductRequestsOverview() {
  const { user } = useAuth();
  const { fetchOrThrow: fetch } = useAuthenticatedFetch();

  const { data, error, isLoading } = useQuery({
    queryKey: ["product-requests"],
    queryFn: () => getProductRequests(fetch),
  });

  const reviewRequest = useOpenData<ProductRequest>();

  const columns: ColumnDef<ProductRequest>[] = useMemo(
    () => [
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
            <Link
              to={row.original.asset ? `/assets/${row.original.asset.id}` : "#"}
              className="flex items-center gap-2 group"
            >
              {row.original.asset?.product?.productCategory?.icon && (
                <Icon
                  iconId={row.original.asset.product.productCategory.icon}
                  color={row.original.asset.product.productCategory.color}
                  className="text-lg"
                />
              )}
              <span className="group-hover:underline">{assetName}</span>
            </Link>
          );
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => reviewRequest.openData(request)}
            >
              Details
            </Button>
          );
        },
      },
    ],
    [reviewRequest]
  );

  return error ? (
    <ErrorDashboardTile />
  ) : (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Product Requests</CardTitle>
          <CardDescription>
            Requests shown from the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-inherit">
          <VirtualizedDataTable
            height="100%"
            maxHeight={400}
            columns={columns}
            initialState={{
              sorting: [{ id: "orderedOn", desc: true }],
              columnVisibility: {
                review: can(user, "review", "product-requests"),
              },
            }}
            data={data?.results ?? []}
            loading={isLoading}
          />
        </CardContent>
      </Card>
      <ReviewProductRequestModal
        open={reviewRequest.open}
        onOpenChange={reviewRequest.setOpen}
        request={reviewRequest.data}
      />
    </>
  );
}

const getProductRequests = async (
  fetch: (url: string, options: RequestInit) => Promise<Response>
) => {
  const qs = stringifyQuery({
    createdOn: { gte: subDays(new Date(), 30).toISOString() },
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
        // title="Review Product Request"
        title="Product Request Details"
        open={open}
        onOpenChange={onOpenChange}
        dialogClassName="sm:max-w-lg"
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
