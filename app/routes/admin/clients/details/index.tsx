import type { ColumnDef } from "@tanstack/react-table";
import { format, isAfter } from "date-fns";
import { Pencil, PhoneCall, Star } from "lucide-react";
import { Link, useRouteLoaderData } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import EditClientButton from "~/components/clients/edit-client-button";
import EditSiteButton from "~/components/clients/edit-site-button";
import { CopyableText } from "~/components/copyable-text";
import DataList from "~/components/data-list";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import type { Client, Site } from "~/lib/models";
import {
  updateClientSchemaResolver,
  type updateClientSchema,
} from "~/lib/schema";
import {
  beautifyPhone,
  getValidatedFormDataOrThrow,
  validateParam,
} from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request, params }: Route.ActionArgs) => {
  const id = validateParam(params, "id");

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateClientSchema>
    >(request, updateClientSchemaResolver);

    return api.clients.update(request, id, data);
  } else if (request.method === "DELETE") {
    return api.clients.deleteAndRedirect(request, id, "/admin/clients");
  }

  throw new Response("Invalid method", { status: 405 });
};

export default function ClientDetails() {
  const client = useRouteLoaderData<Client>(
    "routes/admin/clients/details/layout"
  );
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>
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
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSitesTable
            sites={client?.sites ?? []}
            clientId={client?.id ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface ClientSitesTableProps {
  clientId: string;
  sites: Site[];
}

function ClientSitesTable({ sites, clientId }: ClientSitesTableProps) {
  const columns: ColumnDef<Site>[] = [
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
  ];
  return (
    <>
      <DataTable
        data={sites}
        columns={columns}
        searchPlaceholder="Search sites..."
        actions={[<EditSiteButton key="add" clientId={clientId} />]}
      />
    </>
  );
}
