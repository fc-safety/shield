import { api } from "~/.server/api";
import type { Route } from "./+types/product-categories";

export function loader({ request }: Route.LoaderArgs) {
  return api.productCategories.list(request, { limit: 10000 });
}
