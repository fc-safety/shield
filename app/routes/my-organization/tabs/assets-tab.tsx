import { api } from "~/.server/api";
import ClientDetailsTabsAssetsTab from "~/components/clients/pages/client-details-tabs/assets-tab";
import type { Route } from "./+types/assets-tab";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const assetsResult = await api.assets.list(request, { limit: 10000 });

  return {
    assets: assetsResult.results,
  };
};

export default function AssetsTab({ loaderData: { assets } }: Route.ComponentProps) {
  return <ClientDetailsTabsAssetsTab assets={assets} viewContext="user" />;
}
