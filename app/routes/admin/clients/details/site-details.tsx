import { type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import SiteDetailsForm from "~/components/clients/site-details-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { updateSiteSchema, updateSiteSchemaResolver } from "~/lib/schema";
import {
  buildTitleFromBreadcrumb,
  getValidatedFormDataOrThrow,
  validateParam,
  validateParams,
} from "~/lib/utils";
import type { Route } from "./+types/site-details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.name || "Site Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { id, siteId } = validateParams(params, ["id", "siteId"]);

  if (request.method === "POST" || request.method === "PATCH") {
    const { data } = await getValidatedFormDataOrThrow<
      z.infer<typeof updateSiteSchema>
    >(request, updateSiteSchemaResolver);

    return api.sites.update(request, siteId, data);
  } else if (request.method === "DELETE") {
    return api.sites.deleteAndRedirect(request, siteId, `/admin/clients/${id}`);
  }

  throw new Response("Invalid method", { status: 405 });
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const siteId = validateParam(params, "siteId");
  return api.sites.get(request, siteId);
};

export default function SiteDetails({
  loaderData: site,
}: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>Site Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SiteDetailsForm clientId={site.clientId} site={site} />
        </CardContent>
      </Card>
      <Card className="h-max">
        <CardHeader>
          <CardTitle>...</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    </div>
  );
}
