import { api } from "~/.server/api";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/inspections";

export function loader({ request, params }: Route.LoaderArgs) {
  const assetId = validateParam(params, "assetId");
  return api.assets.listAlerts(request, assetId, { limit: 10000 });
}
