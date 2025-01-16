import { api } from "~/.server/api";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/list";

export function loader({ request, params }: Route.LoaderArgs) {
  const assetId = validateParam(params, "assetId");
  return api.assets.alerts(assetId).list(request, { limit: 10000 });
}
