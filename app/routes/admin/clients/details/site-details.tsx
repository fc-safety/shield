import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import EditSiteButton from "~/components/clients/edit-site-button";
import { CopyableText } from "~/components/copyable-text";
import DataList from "~/components/data-list";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { updateSiteSchema, updateSiteSchemaResolver } from "~/lib/schema";
import {
  beautifyPhone,
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
          <div className="inline-flex items-center gap-4">
            Site Details
            <div className="flex gap-2">
              <EditSiteButton
                site={site}
                clientId={site.clientId}
                trigger={
                  <Button variant="secondary" size="icon" type="button">
                    <Pencil />
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-8">
          {/* <SiteDetailsForm clientId={site.clientId} site={site} /> */}
          <div className="grid gap-4">
            <Label>Properties</Label>
            <DataList
              details={[
                {
                  label: "Name",
                  value: site.name,
                },
                {
                  label: "External ID",
                  value: <CopyableText text={site.externalId} />,
                },
                {
                  label: "Is Primary Site",
                  value: site.primary ? "Yes" : "No",
                },
              ]}
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
                      {site.address.street1}
                      <br />
                      {site.address.street2 && (
                        <>
                          {site.address.street2}
                          <br />
                        </>
                      )}
                      {site.address.city}, {site.address.state}{" "}
                      {site.address.zip}
                    </span>
                  ),
                },
                {
                  label: "Phone Number",
                  value: beautifyPhone(site.phoneNumber),
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
                  value: format(site.createdOn, "PPpp"),
                },
                {
                  label: "Last Updated",
                  value: format(site.modifiedOn, "PPpp"),
                },
              ]}
              defaultValue={<>&mdash;</>}
            />
          </div>
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
