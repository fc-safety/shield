import type { ViewContext } from "~/.server/api-utils";
import type { Site } from "~/lib/models";
import ClientSitesCard from "../../client-sites-card";

export default function ClientDetailsTabsSitesTab({
  sites,
  sitesTotalCount,
  clientId,
  viewContext,
}: {
  sites: Site[];
  sitesTotalCount: number;
  clientId?: string;
  viewContext: ViewContext;
}) {
  return (
    <ClientSitesCard
      sites={sites ?? []}
      sitesTotalCount={sitesTotalCount}
      clientId={clientId}
      buildToSite={(id) => `../sites/${id}`}
      viewContext={viewContext}
    />
  );
}
