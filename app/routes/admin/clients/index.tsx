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
import { useImmer } from "use-immer";
import { api } from "~/.server/api";
import EditClientButton from "~/components/clients/edit-client-button";
import ConfirmationDialog from "~/components/confirmation-dialog";
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
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { Client } from "~/lib/models";
import { beautifyPhone } from "~/lib/utils";
import type { Route } from "./+types/index";

export function loader({ request }: Route.LoaderArgs) {
  return api.clients.list(request, { limit: 10000 });
}

export default function ClientsIndex({
  loaderData: clients,
}: Route.ComponentProps) {
  const { submit: submitDelete } = useModalSubmit({
    defaultErrorMessage: "Error: Failed to delete client",
  });

  const [deleteAction, setDeleteAction] = useImmer({
    open: false,
    action: () => {},
    cancel: () => {},
    title: "Are you sure?",
    message: "",
    requiredUserInput: "",
  });

  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),

        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="hover:underline">
            {getValue() as string}
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
        accessorKey: "status",
        header: ({ column, table }) => (
          <DataTableColumnHeader column={column} table={table} />
        ),

        cell: ({ getValue }) => (
          <span className="capitalize">{String(getValue()).toLowerCase()}</span>
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
                      draft.action = () => {
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
      <ConfirmationDialog
        open={deleteAction.open}
        onOpenChange={(open) =>
          setDeleteAction((draft) => {
            draft.open = open;
          })
        }
        destructive
        onConfirm={() => deleteAction.action()}
        confirmText="Delete"
        onCancel={() => deleteAction.cancel()}
        requiredUserInput={deleteAction.requiredUserInput}
        title={deleteAction.title}
        message={deleteAction.message}
      />
    </>
  );
}
