import type { ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsSitesTab from "~/components/clients/pages/client-details-tabs/sites-tab";
import { nestSites } from "~/lib/services/clients.service";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/sites-tab";

export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  const { formMethod, formAction } = arg;
  if (formMethod === "DELETE" && formAction && !formAction.startsWith("/api/proxy/sites")) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const sitesResult = await api.sites.list(
    request,
    {
      limit: 1000,
    },
    { clientId: id, accessIntent: "elevated" }
  );

  return {
    sites: nestSites(sitesResult.results),
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
    />
  );
}
