import { useRouteLoaderData, type ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsSitesTab from "~/components/clients/pages/client-details-tabs/sites-tab";
import { nestSites } from "~/lib/services/clients.service";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/sites-tab";

export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  const { formMethod, formAction } = arg;
  if (formMethod === "DELETE" && formAction && !formAction.startsWith("/api/proxy/sites")) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const sitesResult = await api.sites.list(request, {
    limit: 1000,
  });

  return {
    sites: nestSites(sitesResult.results),
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
    />
  );
}
