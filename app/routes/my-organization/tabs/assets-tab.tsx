import type { ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsAssetsTab from "~/components/clients/pages/client-details-tabs/assets-tab";
import type { Route } from "./+types/assets-tab";

export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  const { formMethod, formAction } = arg;
  if (formMethod === "DELETE" && formAction && !formAction.startsWith("/api/proxy/assets")) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const assetsResult = await api.assets.list(request, { limit: 10000, site: { active: true } });

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
