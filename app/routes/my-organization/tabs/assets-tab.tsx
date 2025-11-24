import { api } from "~/.server/api";
import ClientDetailsTabsAssetsTab from "~/components/clients/pages/client-details-tabs/assets-tab";
import type { Route } from "./+types/assets-tab";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const assetsResult = await api.assets.list(request, { limit: 10000 });

  return {
    assets: assetsResult.results,
    assetsTotalCount: assetsResult.count,
  };
};

export default function AssetsTab({
  loaderData: { assets, assetsTotalCount },
}: Route.ComponentProps) {
  return (
    <ClientDetailsTabsAssetsTab
      assets={assets}
      assetsTotalCount={assetsTotalCount}
      viewContext="user"
    />
  );
}
