import { api } from "~/.server/api";
import ClientDetailsTabsAssetsTab from "~/components/clients/pages/client-details-tabs/assets-tab";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/assets-tab";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const assetsResult = await api.assets.list(
    request,
    { limit: 10000, clientId: id },
    { context: "admin" }
  );

  return {
    assets: assetsResult.results,
    assetsTotalCount: assetsResult.count,
    clientId: id,
  };
};

export default function AssetsTab({
  loaderData: { assets, assetsTotalCount, clientId },
}: Route.ComponentProps) {
  return (
    <ClientDetailsTabsAssetsTab
      assets={assets}
      assetsTotalCount={assetsTotalCount}
      clientId={clientId}
      viewContext="admin"
    />
  );
}
