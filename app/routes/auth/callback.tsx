import { createId } from "@paralleldrive/cuid2";
import { redirect } from "react-router";
import { authenticator, type Tokens } from "~/.server/authenticator";
import { clearCookieHeaderValue } from "~/.server/request-context";
import { getSession, userSessionStorage } from "~/.server/sessions";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  let tokens: Tokens;
  try {
    tokens = await authenticator.then((a) => a.authenticate("oauth2", request));
  } catch (e) {
    return redirect("/login");
  }

  const session = await getSession(request, userSessionStorage);
  if (!session.has("id")) {
    session.set("id", createId());
  }
  session.set("tokens", tokens);

  const returnTo = session.get("returnTo") ?? "/";
  session.unset("returnTo");

  // Clear any existing middleware set cookie values.
  clearCookieHeaderValue("authSession");

  const headers = new Headers({
    "Set-Cookie": await userSessionStorage.commitSession(session),
  });

  return redirect(returnTo, { headers });
}
