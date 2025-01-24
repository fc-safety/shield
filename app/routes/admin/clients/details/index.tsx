import type { ColumnDef } from "@tanstack/react-table";
import { format, isAfter } from "date-fns";
import { Boxes, Building2, Pencil, Star, Users, Warehouse } from "lucide-react";
import { Link, useRouteLoaderData } from "react-router";
import { api } from "~/.server/api";
import ClientUsersTable from "~/components/clients/client-users-table";
import EditClientButton from "~/components/clients/edit-client-button";
import EditSiteButton from "~/components/clients/edit-site-button";
import SitesTable from "~/components/clients/sites-table";
import { CopyableText } from "~/components/copyable-text";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import type { Client, Site } from "~/lib/models";
import { beautifyPhone, validateParam } from "~/lib/utils";
import type { Route } from "./+types/index";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  return api.clients
    .users(id)
    .list(request, { limit: 10000 })
    .catch((e) => {
      if (e instanceof Response && e.status === 403) {
        return null;
      }
      throw e;
    });
};

export default function ClientDetails({
  loaderData: users,
}: Route.ComponentProps) {
  const client = useRouteLoaderData<Client>(
    "routes/admin/clients/details/layout"
  );
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <Building2 />
              <div className="inline-flex items-center gap-4">
                Client Details
                <div className="flex gap-2">
                  <EditClientButton
                    client={client}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          {/* <CardContent>
          <ClientDetailsForm client={client} /> */}
          <CardContent className="grid gap-8">
            {client ? (
              <>
                <div className="grid gap-4">
                  <Label>Properties</Label>
                  <DataList
                    details={[
                      {
                        label: "Status",
                        value: client.status,
                      },
                      {
                        label: "Name",
                        value: client.name,
                      },
                      {
                        label: "External ID",
                        value: <CopyableText text={client.externalId} />,
                      },
                      {
                        label: isAfter(client.startedOn, new Date())
                          ? "Starts On"
                          : "Started On",
                        value: format(client.startedOn, "PPpp"),
                      },
                    ]}
                    defaultValue={<>&mdash;</>}
                  />
                </div>
                <div className="grid gap-4">
                  <Label>Contact</Label>
                  <DataList
                    details={[
                      {
                        label: "Address",
                        value: (
                          <span>
                            {client.address.street1}
                            <br />
                            {client.address.street2 && (
                              <>
                                {client.address.street2}
                                <br />
                              </>
                            )}
                            {client.address.city}, {client.address.state}{" "}
                            {client.address.zip}
                          </span>
                        ),
                      },
                      {
                        label: "Phone Number",
                        value: beautifyPhone(client.phoneNumber),
                      },
                    ]}
                    defaultValue={<>&mdash;</>}
                  />
                </div>
                <div className="grid gap-4">
                  <Label>Other</Label>
                  <DataList
                    details={[
                      {
                        label: "Created",
                        value: format(client.createdOn, "PPpp"),
                      },
                      {
                        label: "Last Updated",
                        value: format(client.modifiedOn, "PPpp"),
                      },
                    ]}
                    defaultValue={<>&mdash;</>}
                  />
                </div>
              </>
            ) : (
              <Skeleton className="h-64 w-full rounded" />
            )}
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Boxes /> Site groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientSiteGroupsTable
                sites={client?.sites?.filter((s) => s._count?.subsites) ?? []}
                clientId={client?.id ?? ""}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <Warehouse /> Sites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SitesTable
                sites={client?.sites?.filter((s) => !s._count?.subsites) ?? []}
                clientId={client?.id ?? ""}
                buildToSite={(id) => "sites/" + id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {users && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>
              <Users /> Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClientUsersTable
              users={users.results}
              getSiteByExternalId={(externalId) =>
                client?.sites?.find((s) => s.externalId === externalId)
              }
              clientId={client?.id ?? ""}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ClientSiteGroupsTableProps {
  clientId: string;
  sites: Site[];
}

function ClientSiteGroupsTable({
  sites,
  clientId,
}: ClientSiteGroupsTableProps) {
  const columns: ColumnDef<Exclude<Client["sites"], undefined>[number]>[] = [
    {
      accessorKey: "name",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),

      cell: ({ row, getValue }) => (
        <Link
          to={"sites/" + row.original.id}
          className="inline-flex items-center gap-1 hover:underline"
        >
          {getValue() as string}
          {row.original.primary && (
            <Star size={14} fill="currentColor" className="text-primary" />
          )}
        </Link>
      ),
    },
    {
      accessorFn: (data) => data._count?.subsites ?? 0,
      id: "subsites",
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} />
      ),
    },
  ];
  return (
    <>
      <DataTable
        data={sites}
        columns={columns}
        searchPlaceholder="Search site groups..."
        actions={[<EditSiteButton key="add" clientId={clientId} isSiteGroup />]}
      />
    </>
  );
}
