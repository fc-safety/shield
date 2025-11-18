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
  };
};

export default function SitesTab({ loaderData: { sites } }: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("my-organization");

  return (
    <ClientDetailsTabsSitesTab sites={sites} clientId={layoutData?.client?.id} viewContext="user" />
  );
}
