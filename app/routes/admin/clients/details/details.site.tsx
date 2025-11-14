import { type ShouldRevalidateFunctionArgs, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import { catchResponse } from "~/.server/api-utils";
import ClientSitesCard from "~/components/clients/client-sites-card";
import ClientUsersCard from "~/components/clients/client-users-card";
import SiteDetailsCard from "~/components/clients/site-details-card";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/details.site.tsx";

// When deleting a site, we don't want to revalidate the page. This would
// cause a 404 before the page could navigate back.
export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  if (arg.formMethod === "DELETE") {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const handle = {
  breadcrumb: ({
    loaderData,
  }: Route.MetaArgs | UIMatch<Route.MetaArgs["loaderData"] | undefined>) => ({
    label: loaderData?.site.name || "Site Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const siteId = validateParam(params, "siteId");

  const site = await api.sites.get(request, siteId, { context: "admin" });
  const usersResult = catchResponse(
    api.users.list(
      request,
      {
        clientId: site.clientId,
        siteExternalId: site.externalId,
        limit: 10000,
      },
      { context: "admin" }
    ),
    { codes: [403] }
  );

  return {
    site,
    users: (await usersResult).data.data?.results ?? [],
  };
};

export default function SiteDetails({ loaderData: { site, users } }: Route.ComponentProps) {
  const isSiteGroup = !!site?.subsites && site.subsites.length > 0;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-2 sm:gap-4">
      <SiteDetailsCard isSiteGroup={isSiteGroup} site={site} viewContext="admin" />
      <div className="grid gap-4">
        {site.subsites && site.subsites.length > 0 && (
          <ClientSitesCard
            title="Subsites"
            sites={site.subsites}
            clientId={site.clientId}
            parentSiteId={site.id}
            buildToSite={(id) => `../sites/${id}`}
          />
        )}
      </div>
      {users && (
        <ClientUsersCard users={users} clientId={site.clientId} siteExternalId={site.externalId} />
      )}
    </div>
  );
}
