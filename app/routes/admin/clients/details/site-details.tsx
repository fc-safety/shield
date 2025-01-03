import { redirect } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { deleteSite, getSite, updateSite } from "~/.server/api";
import SiteDetailsForm from "~/components/clients/site-details-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { updateSiteSchema, updateSiteSchemaResolver } from "~/lib/schema";
import type { Route } from "./+types/site-details";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs) => ({
    label: data.name || "Site Details",
  }),
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { id, siteId } = params;
  if (!id || !siteId) {
    throw new Response("No Client and/or Site IDs", { status: 400 });
  }

  if (request.method === "POST" || request.method === "PATCH") {
    const { data, errors } = await getValidatedFormData<
      z.infer<typeof updateSiteSchema>
    >(request, updateSiteSchemaResolver);

    if (errors) {
      throw Response.json({ errors }, { status: 400 });
    }

    return updateSite(request, siteId, data);
  } else if (request.method === "DELETE") {
    await deleteSite(request, siteId);
    return redirect(`/admin/clients/${id}`);
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { siteId } = params;
  if (!siteId) {
    throw new Response("No Site ID", { status: 400 });
  }

  return getSite(request, siteId);
};

export default function SiteDetails({
  loaderData: site,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-4">
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Site Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SiteDetailsForm site={site} />
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>...</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    </div>
  );
}
