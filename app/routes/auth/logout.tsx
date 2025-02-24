import { redirect, type Session } from "react-router";
import { strategy } from "~/.server/authenticator";
import { APP_HOST, CLIENT_ID, LOGOUT_URL } from "~/.server/config";
import { logger } from "~/.server/logger";
import { userSessionStorage } from "~/.server/sessions";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/logout";

export async function loader({ request }: Route.LoaderArgs) {
  const returnTo = getSearchParam(request, "returnTo");
  const postLogoutUrl = URL.parse(returnTo ?? "/", APP_HOST)?.toString() ?? "";

  let session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>;
  try {
    session = await userSessionStorage.getSession(
      request.headers.get("cookie")
    );
  } catch (e) {
    logger.warn(
      {
        details: e,
      },
      "Failed to get session"
    );
    return redirect(postLogoutUrl, {
      headers: {
        "Set-Cookie": await userSessionStorage.destroySession({} as Session),
      },
    });
  }

  const tokens = session.get("tokens");
  if (tokens) {
    await strategy.then((s) => s.revokeToken(tokens.accessToken));
  }

  const logoutUrl = URL.parse(LOGOUT_URL);
  logoutUrl?.searchParams.set("client_id", CLIENT_ID);
  logoutUrl?.searchParams.set("post_logout_redirect_uri", postLogoutUrl);

  return redirect(logoutUrl?.toString() ?? "/", {
    headers: { "Set-Cookie": await userSessionStorage.destroySession(session) },
  });
}
