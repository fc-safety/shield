import { api } from "~/.server/api";
import type { Route } from "./+types/manufacturers";

export function loader({ request }: Route.LoaderArgs) {
  return api.manufacturers.list(request, { limit: 10000 });
}
