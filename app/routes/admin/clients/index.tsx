import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, CornerDownRight, PhoneCall, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link, useRevalidator } from "react-router";
import { api } from "~/.server/api";
import ActiveIndicator2 from "~/components/active-indicator-2";
import EditClientButton from "~/components/clients/edit-client-button";
import ResponsiveActions from "~/components/common/responsive-actions";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { ClientStatuses, type Client } from "~/lib/models";
import { can } from "~/lib/users";
import { beautifyPhone, capitalize } from "~/lib/utils";
import type { Route } from "./+types/index";
import MigrationAssistantButton from "./components/migration-assistant/migration-assistant-button";

export function loader({ request }: Route.LoaderArgs) {
  return api.clients.list(request, { limit: 10000 }, { context: "admin" });
}

export default function ClientsIndex({ loaderData: clients }: Route.ComponentProps) {
  const { user } = useAuth();
  const canDeleteClient = can(user, "delete", "clients");

  const { revalidate } = useRevalidator();
  const { submitJson: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete client",
  });

  const [deleteAction, setDeleteAction] = useConfirmAction({
    variant: "destructive",
  });

  const columns = useMemo(
    (): ColumnDef<Client>[] => [
      {
        accessorKey: "status",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ getValue }) => {
          const status = (getValue() as string).toLowerCase() as Lowercase<Client["status"]>;
          return (
            <div className="flex items-center gap-2 capitalize">
              <ActiveIndicator2 active={status} />
              {status}
            </div>
          );
        },
        filterFn: "defaultIncludes" as any,
      },
      {
        accessorKey: "name",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,

        cell: ({ row, getValue }) => (
          <Link to={row.original.id} className="flex items-center gap-2 hover:underline">
            {getValue() as string}
            {row.original.demoMode && <Badge variant="default">Demo</Badge>}
          </Link>
        ),
      },
      {
        accessorFn: (data) => `${data.address.city}, ${data.address.state}`,
        id: "city",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
      },
      {
        accessorFn: (data) => beautifyPhone(data.phoneNumber),
        id: "phone",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,

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
        accessorKey: "demoMode",
        id: "demo mode",
        header: ({ column, table }) => <DataTableColumnHeader column={column} table={table} />,
        cell: ({ row, getValue }) => (
          <Badge variant={(getValue() as boolean) ? "default" : "secondary"}>
            {(getValue() as boolean) ? "Yes" : "No"}
          </Badge>
        ),
        filterFn: "defaultIncludes" as any,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const client = row.original;

          return (
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "details",
                      text: "Details",
                      Icon: CornerDownRight,
                      linkTo: client.id,
                    },
                  ],
                },
                {
                  key: "destructive-actions",
                  variant: "destructive",
                  actions: [
                    {
                      key: "delete",
                      text: "Delete",
                      Icon: Trash,
                      disabled: !canDeleteClient,
                      onAction: () =>
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
                                path: `/api/proxy/clients/${client.id}`,
                                viewContext: "admin",
                              }
                            );
                          };
                        }),
                    },
                  ],
                },
              ]}
            />
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
            actions={[
              <EditClientButton key="add" />,
              <MigrationAssistantButton key="migration" onComplete={() => revalidate()} />,
            ]}
            initialState={{
              columnVisibility: {
                "demo mode": false,
              },
            }}
            filters={({ table }) => [
              {
                title: "Status",
                multiple: true,
                column: table.getColumn("status"),
                options: Object.values(ClientStatuses).map((status) => ({
                  label: capitalize(status.toLowerCase()),
                  value: status,
                })),
              },
              {
                title: "Demo Mode",
                column: table.getColumn("demo mode"),
                options: [
                  {
                    label: "Yes",
                    value: true,
                  },
                  {
                    label: "No",
                    value: false,
                  },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}
