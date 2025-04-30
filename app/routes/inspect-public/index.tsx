import { redirect } from "react-router";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return redirect("/public-inspect/history");
};
