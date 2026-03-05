import { redirect } from "react-router";
import { authenticator, type Tokens } from "~/.server/authenticator";
import { logger } from "~/.server/logger";
import { authRetryCookie } from "~/.server/sessions";
import { commitUserSession, getUserSession, refreshUserSession } from "~/.server/user-sesssion";
import { buildPath } from "~/lib/urls";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  let tokens: Tokens;
  try {
    tokens = await authenticator.then((a) => a.authenticate("oauth2", request));
  } catch (e) {
    logger.error(e, "Failed to finish authentication and fetch access tokens.");

    // Try to get the user's email from the session to preserve login_hint
    // through retries, so the IdP can pre-fill the email field.
    const sessionResult = await getUserSession(request);
    const loginHint = sessionResult.session?.get("email") ?? undefined;

    // Auto-retry once for transient state mismatch errors (common on first
    // IdP login when extra redirects cause the OAuth state cookie to be lost).
    // A short-lived cookie prevents infinite retry loops.
    const hasRetried = await authRetryCookie.parse(request.headers.get("cookie"));
    if (!hasRetried) {
      logger.info("Auto-retrying authentication (first attempt failed).");
      return redirect(buildPath("/login", { login_hint: loginHint }), {
        headers: {
          "Set-Cookie": await authRetryCookie.serialize("1"),
        },
      });
    }

    // Already retried once — clear the retry cookie and show the error.
    return redirect(
      buildPath("/login", { error: "authentication_failed", login_hint: loginHint }),
      {
        headers: {
          "Set-Cookie": await authRetryCookie.serialize("", { maxAge: 0 }),
        },
      }
    );
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
