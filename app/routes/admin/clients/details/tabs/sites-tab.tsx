import { api } from "~/.server/api";
import ClientDetailsTabsSitesTab from "~/components/clients/pages/client-details-tabs/sites-tab";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/sites-tab";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const sitesResult = await api.sites.list(
    request,
    {
      limit: 10000,
      clientId: id,
      parentSiteId: "_NULL",
      include: { subsites: { include: { address: true } } },
    },
    { context: "admin" }
  );

  return {
    sites: sitesResult.results,
    sitesTotalCount: sitesResult.count,
    clientId: id,
  };
};

export default function SitesTab({
  loaderData: { sites, sitesTotalCount, clientId },
}: Route.ComponentProps) {
  return (
    <ClientDetailsTabsSitesTab
      sites={sites}
      sitesTotalCount={sitesTotalCount}
      clientId={clientId}
      viewContext="admin"
    />
  );
}
