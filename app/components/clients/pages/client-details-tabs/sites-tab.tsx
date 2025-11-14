import type { ViewContext } from "~/.server/api-utils";
import type { Site } from "~/lib/models";
import ClientSitesCard from "../../client-sites-card";

export default function ClientDetailsTabsSitesTab({
  sites,
  clientId,
  viewContext,
}: {
  sites: Site[];
  clientId?: string;
  viewContext: ViewContext;
}) {
  return (
    <ClientSitesCard
      sites={sites ?? []}
      clientId={clientId}
      buildToSite={(id) => `../sites/${id}`}
      viewContext={viewContext}
    />
  );
}
