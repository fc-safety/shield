import { redirect } from "react-router";
import { authenticator } from "~/.server/authenticator";
import { setSessionTokens } from "~/.server/sessions";
import type { Route } from "./+types/_auth.callback";

export async function loader({ request }: Route.LoaderArgs) {
  const tokens = await authenticator.authenticate("oauth2", request);
  const headers = new Headers({
    "Set-Cookie": await setSessionTokens(request, tokens),
  });

  return redirect("/", { headers });
}
