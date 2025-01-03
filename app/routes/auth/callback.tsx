import { redirect } from "react-router";
import { authenticator, type Tokens } from "~/.server/authenticator";
import { setSessionTokens } from "~/.server/sessions";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  let tokens: Tokens;
  try {
    tokens = await authenticator.authenticate("oauth2", request);
  } catch (e) {
    return redirect("/login");
  }
  const headers = new Headers({
    "Set-Cookie": await setSessionTokens(request, tokens),
  });

  return redirect("/", { headers });
}
