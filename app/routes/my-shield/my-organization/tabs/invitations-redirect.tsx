import { redirect } from "react-router";
import type { Route } from "./+types/invitations-redirect";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  return redirect(url.pathname.replace("/invitations", "/members"));
};
