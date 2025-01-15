import { api } from "~/.server/api";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/inspections";

export function loader({ request, params }: Route.LoaderArgs) {
  const id = validateParam(params, "id");
  return api.inspections.get(request, id);
}
