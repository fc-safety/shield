import { api } from "~/.server/api";
import type { Route } from "./+types/products";

export function loader({ request }: Route.LoaderArgs) {
  return api.products.list(request, { limit: 10000 });
}
