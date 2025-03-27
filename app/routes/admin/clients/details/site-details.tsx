import { format } from "date-fns";
import { Boxes, Pencil, Users, Warehouse } from "lucide-react";
import { Link, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import ClientUsersTable from "~/components/clients/client-users-table";
import EditSiteButton from "~/components/clients/edit-site-button";
import SitesTable from "~/components/clients/sites-table";
import { CopyableText } from "~/components/copyable-text";
import DataList from "~/components/data-list";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  beautifyPhone,
  buildTitleFromBreadcrumb,
  validateParam,
} from "~/lib/utils";
import type { Route } from "./+types/site-details";

export const handle = {
  breadcrumb: ({
    data,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"] | undefined>) => ({
    label: data?.site.name || "Site Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const siteId = validateParam(params, "siteId");
  return api.sites.get(request, siteId).mapWith((site) =>
    api.users
      .list(
        request,
        {
          clientId: site.clientId,
          siteExternalId: site.externalId,
          limit: 10000,
        },
        { context: "admin" }
      )
      .catchResponse()
      .mapTo((dataOrError) => {
        // Catch 403s from the API. If access is forbidden, only hide the users part and not the entire page.
        if (
          dataOrError.error &&
          dataOrError.error instanceof Response &&
          dataOrError.error.status !== 403
        ) {
          throw dataOrError.error;
        }

        return {
          site,
          users: dataOrError.data?.results,
        };
      })
  );
};

export default function SiteDetails({
  loaderData: { site, users },
}: Route.ComponentProps) {
  const isSiteGroup = site?.subsites && site.subsites.length > 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(450px,_1fr))] gap-2 sm:gap-4">
      <Card className="h-max">
        <CardHeader>
          <CardTitle>
            {isSiteGroup ? <Boxes /> : <Warehouse />}
            <div className="inline-flex items-center gap-4">
              Site {isSiteGroup ? "Group " : ""}Details
              <div className="flex gap-2">
                <EditSiteButton
                  site={site}
                  clientId={site.clientId}
                  trigger={
                    <Button variant="secondary" size="icon" type="button">
                      <Pencil />
                    </Button>
                  }
                  isSiteGroup={isSiteGroup}
                />
              </div>
            </div>
          </CardTitle>
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
                  hidden: isSiteGroup,
                },
                {
                  label: "Parent Site",
                  value: (
                    <Button variant="link" className="px-0">
                      <Link to={`../sites/${site.parentSiteId}`}>
                        {site.parentSite?.name}
                      </Link>
                    </Button>
                  ),
                  hidden: !site.parentSite,
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
      <div className="grid gap-4">
        {site.subsites && site.subsites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Warehouse /> Subsites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SitesTable
                sites={site.subsites}
                clientId={site.clientId}
                parentSiteId={site.id}
                buildToSite={(id) => `../sites/${id}`}
              />
            </CardContent>
          </Card>
        )}
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
              users={users}
              clientId={site.clientId}
              siteExternalId={site.externalId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
