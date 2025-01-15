import { api } from "~/.server/api";
import type { Route } from "./+types/tags";

export function loader({ request }: Route.LoaderArgs) {
  return api.tags.list(request, { limit: 10000 });
}
