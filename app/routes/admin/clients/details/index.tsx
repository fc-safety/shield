import type { ColumnDef } from "@tanstack/react-table";
import { PhoneCall, Star } from "lucide-react";
import { Link, useRouteLoaderData } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
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
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientDetailsForm client={client} />
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
        actions={[<NewSiteButton key="add" clientId={clientId} />]}
      />
    </>
  );
}
