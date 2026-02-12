import { redirect, type Session } from "react-router";
import { strategy } from "~/.server/authenticator";
import { config } from "~/.server/config";
import { cookieStore } from "~/.server/cookie-store";
import { logger } from "~/.server/logger";
import { userSessionStorage } from "~/.server/sessions";
import { getUserSession } from "~/.server/user-sesssion";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/logout";

export async function loader({ request }: Route.LoaderArgs) {
  const returnTo = getSearchParam(request, "returnTo");
  const postLogoutUrl =
    (returnTo || !config.POST_LOGOUT_URL
      ? URL.parse(returnTo ?? "/", config.APP_HOST)?.toString()
      : config.POST_LOGOUT_URL) ??
    config.POST_LOGOUT_URL ??
    "";

  // Clear any existing middleware set cookie values.
  cookieStore.unset("authSession");

  const sessionResult = await getUserSession(request);
  if (!sessionResult.session) {
    logger.warn(
      {
        error: sessionResult.cause ?? new Error(sessionResult.reason),
      },
      "Failed to get session"
    );
    return redirect(postLogoutUrl, {
      headers: {
        "Set-Cookie": await userSessionStorage.destroySession({} as Session),
      },
    });
  }
  const session = sessionResult.session;

  const tokens = session.get("tokens");
  if (tokens) {
    await strategy.then((s) => s.revokeToken(tokens.accessToken));
  }

  const logoutUrl = URL.parse(config.LOGOUT_URL);
  logoutUrl?.searchParams.set("client_id", config.CLIENT_ID);
  logoutUrl?.searchParams.set("post_logout_redirect_uri", postLogoutUrl);

  return redirect(logoutUrl?.toString() ?? "/", {
    headers: { "Set-Cookie": await userSessionStorage.destroySession(session) },
  });
}
