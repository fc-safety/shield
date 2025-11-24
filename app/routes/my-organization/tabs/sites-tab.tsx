import { useRouteLoaderData } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsSitesTab from "~/components/clients/pages/client-details-tabs/sites-tab";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/sites-tab";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const sitesResult = await api.sites.list(request, {
    limit: 10000,
    parentSiteId: "_NULL",
    include: { subsites: { include: { address: true } } },
  });

  return {
    sites: sitesResult.results,
    sitesTotalCount: sitesResult.count,
  };
};

export default function SitesTab({ loaderData: { sites, sitesTotalCount } }: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/my-organization/layout");

  return (
    <ClientDetailsTabsSitesTab
      sites={sites}
      sitesTotalCount={sitesTotalCount}
      clientId={layoutData?.client?.id}
      viewContext="user"
    />
  );
}
