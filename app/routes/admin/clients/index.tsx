import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  CornerDownRight,
  MoreHorizontal,
  PhoneCall,
  Trash,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import EditClientButton from "~/components/clients/edit-client-button";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Client } from "~/lib/models";
import { beautifyPhone } from "~/lib/utils";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
  return api.clients.list(request, { limit: 10000 }, { context: "admin" });
}

export default function ClientsIndex({
  loaderData: clients,
}: Route.ComponentProps) {
  const { submit: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete client",
  });

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      {
        accessorKey: "status",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
        cell: ({ getValue }) => {
          const status = (getValue() as string).toLowerCase() as Lowercase<
            Client["status"]
          >;
          return (
            <div className="capitalize flex items-center gap-2">
              <ActiveIndicator2 active={status} />
              {status}
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),

        cell: ({ row, getValue }) => (
          <Link
            to={row.original.id}
            className="hover:underline flex items-center gap-2"
          >
            {getValue() as string}
            {row.original.demoMode && <Badge variant="default">Demo</Badge>}
          </Link>
        ),
      },
      {
        accessorKey: "_count.sites",
        id: "sites",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorFn: (data) => `${data.address.city}, ${data.address.state}`,
        id: "city",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),
      },
      {
        accessorFn: (data) => beautifyPhone(data.phoneNumber),
        id: "phone",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),

        cell: ({ row, getValue }) => (
          <HoverCard>
            <HoverCardTrigger>{getValue() as string}</HoverCardTrigger>
            <HoverCardContent>
              <Button variant="link" asChild>
                <a href={`tel:${row.original.phoneNumber}`}>
                  <PhoneCall />
                  Call {getValue() as string}
                </a>
              </Button>
            </HoverCardContent>
          </HoverCard>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const client = row.original;

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
                  <Link to={client.id}>
                    <CornerDownRight />
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    setDeleteAction((draft) => {
                      draft.open = true;
                      draft.title = "Delete Client";
                      draft.message = `Are you sure you want to delete ${
                        client.name || client.id
                      }?`;
                      draft.requiredUserInput = client.name || client.id;
                      draft.onConfirm = () => {
                        submitDelete(
                          {},
                          {
                            method: "delete",
                            action: `/api/proxy/clients/${client.id}?_throw=false`,
                          }
                        );
                      };
                    })
                  }
                >
                  <Trash />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [setDeleteAction, submitDelete]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Building2 /> Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={clients.results}
            searchPlaceholder="Search clients..."
            actions={[<EditClientButton key="add" />]}
          />
        </CardContent>
      </Card>
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
