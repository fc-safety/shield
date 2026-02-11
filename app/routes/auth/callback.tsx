import { redirect } from "react-router";
import { authenticator, type Tokens } from "~/.server/authenticator";
import { getSession, userSessionStorage } from "~/.server/sessions";
import { commitUserSession, refreshUserSession } from "~/.server/user-sesssion";
import { buildPath } from "~/lib/urls";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  let tokens: Tokens;
  try {
    tokens = await authenticator.then((a) => a.authenticate("oauth2", request));
  } catch (e) {
    return redirect("/login?error=authentication_failed");
  }

  const session = await getSession(request, userSessionStorage);
  session.set("tokens", tokens);

  // Get and clear the return to URL from the session.
  const returnTo = session.get("returnTo") ?? "/";
  session.unset("returnTo");

  // Fetch permissions from backend - this is required for login to complete
  const refreshResult = await refreshUserSession(request, { session });

  if (!refreshResult.success) {
    console.error(
      "Failed to fetch current user on login:",
      refreshResult.cause ?? new Error(refreshResult.message)
    );
    // Clear tokens and redirect to login with error to prevent infinite loop
    // The user authenticated with the IdP but we can't reach our backend
    session.unset("tokens");
    await commitUserSession(session);
    return redirect(buildPath("/login", { error: refreshResult.reason }));
  }

  return redirect(returnTo);
}
