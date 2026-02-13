import { redirect } from "react-router";
import { authenticator, type Tokens } from "~/.server/authenticator";
import { logger } from "~/.server/logger";
import { commitUserSession, getUserSession, refreshUserSession } from "~/.server/user-sesssion";
import { buildPath } from "~/lib/urls";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  let tokens: Tokens;
  try {
    tokens = await authenticator.then((a) => a.authenticate("oauth2", request));
  } catch (e) {
    return redirect("/login?error=authentication_failed");
  }

  const sessionResult = await getUserSession(request);
  if (!sessionResult.session) {
    return redirect(buildPath("/login", { error: sessionResult.reason }));
  }
  const session = sessionResult.session;

  session.set("tokens", tokens);

  // Get and clear the return to URL from the session.
  const returnTo = session.get("returnTo") ?? "/";
  session.unset("returnTo");

  // Fetch permissions from backend - this is required for login to complete
  const refreshResult = await refreshUserSession(request, { session });

  if (!refreshResult.success) {
    logger.error(
      refreshResult.cause ?? new Error(refreshResult.message),
      "Failed to fetch current user on login:"
    );
    // Clear tokens and redirect to login with error to prevent infinite loop
    // The user authenticated with the IdP but we can't reach our backend
    session.unset("tokens");
    await commitUserSession(session);
    return redirect(buildPath("/login", { error: refreshResult.reason }));
  }

  await commitUserSession(session);
  return redirect(returnTo);
}
