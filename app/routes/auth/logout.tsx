import { redirect, type Session } from "react-router";
import { strategy } from "~/.server/authenticator";
import { config } from "~/.server/config";
import { logger } from "~/.server/logger";
import { requestContext } from "~/.server/request-context";
import { userSessionStorage } from "~/.server/sessions";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/logout";

export async function loader({ request }: Route.LoaderArgs) {
  const returnTo = getSearchParam(request, "returnTo");
  const postLogoutUrl =
    URL.parse(returnTo ?? "/", config.APP_HOST)?.toString() ?? "";

  // Clear any existing middleware set cookie values.
  requestContext.set("setCookieHeaderValues", (values) => {
    const newValues = { ...values };
    delete newValues.authSession;
    return newValues;
  });

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

  const logoutUrl = URL.parse(config.LOGOUT_URL);
  logoutUrl?.searchParams.set("client_id", config.CLIENT_ID);
  logoutUrl?.searchParams.set("post_logout_redirect_uri", postLogoutUrl);

  return redirect(logoutUrl?.toString() ?? "/", {
    headers: { "Set-Cookie": await userSessionStorage.destroySession(session) },
  });
}
