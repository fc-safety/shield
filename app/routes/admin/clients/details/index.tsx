import type { ColumnDef } from "@tanstack/react-table";
import { PhoneCall, Star } from "lucide-react";
import { Link, redirect, useRouteLoaderData } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { deleteClient, updateClient } from "~/.server/api";
import ClientDetailsForm from "~/components/clients/client-details-form";
import NewSiteButton from "~/components/clients/new-site-button";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import type { Client, Site } from "~/lib/models";
import {
  updateClientSchemaResolver,
  type updateClientSchema,
} from "~/lib/schema";
import { beautifyPhone } from "~/lib/utils";
import type { Route } from "./+types/index";

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { id } = params;
  if (!id) {
    throw new Response("No Client ID", { status: 400 });
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateClientSchema>
    >(request, updateClientSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return updateClient(request, id, data);
  } else if (request.method === "DELETE") {
    await deleteClient(request, id);
    return redirect("/admin/clients");
  }

  throw new Response("Invalid method", { status: 405 });
};

export default function ClientDetails() {
  const client = useRouteLoaderData<Client>(
    "routes/admin/clients/details/layout"
  );
  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-4">
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientDetailsForm client={client} />
        </CardContent>
      </Card>
      <Card className="col-span-3 h-max">
        <CardHeader>
          <CardTitle>Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSitesTable sites={client?.sites ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

interface ClientSitesTableProps {
  sites: Site[];
}

function ClientSitesTable({ sites }: ClientSitesTableProps) {
  const columns: ColumnDef<Site>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="City" />
      ),
    },
    {
      accessorFn: (data) => beautifyPhone(data.phoneNumber),
      id: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
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
        actions={[<NewSiteButton key="add" />]}
      />
    </>
  );
}
