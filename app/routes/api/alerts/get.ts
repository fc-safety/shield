import { api } from "~/.server/api";
import { validateParams } from "~/lib/utils";
import type { Route } from "./+types/get";

export function loader({ request, params }: Route.LoaderArgs) {
  const { assetId, id } = validateParams(params, ["assetId", "id"]);
  return api.assets.alerts(assetId).get(request, id);
}
