import { createCookieSessionStorage, redirect } from "react-router";
import { createThemeSessionResolver } from "remix-themes";
import { isTokenExpired } from "~/lib/users";
import { buildUser, strategy, type Tokens } from "./authenticator";
import { COOKIE_SECRET, SESSION_SECRET } from "./config";
import { logger } from "./logger";

const isProduction = process.env.NODE_ENV === "production";
const domain = process.env.APP_DOMAIN;

const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__remix-themes",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [COOKIE_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const themeSessionResolver =
  createThemeSessionResolver(themeSessionStorage);

export const userSessionStorage = createCookieSessionStorage<{
  tokens?: Tokens | null;
  returnTo?: string;
}>({
  cookie: {
    name: "session",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const getLoginRedirect = async (
  request: Request,
  session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>,
  options: {
    returnTo?: string;
  } = {}
) => {
  session.set("returnTo", options.returnTo ?? request.url);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await userSessionStorage.commitSession(session),
    },
  });
};

export const requireUserSession = async (request: Request) => {
  const session = await userSessionStorage.getSession(
    request.headers.get("cookie")
  );

  let tokens = session.get("tokens");
  if (!tokens) {
    throw await getLoginRedirect(request, session);
  }

  // Preemptively check token to provide a more consistent and earlier reauth
  // experience if needed. If a page requires the user session but makes no API calls,
  // the reauth woudln't happen until after the first API call, which was somewhat jarring.
  // Now both checks are made: 1) refresh preemptively if token is expired or 2) refresh
  // if 401 is received from API.
  if (isTokenExpired(tokens.accessToken)) {
    tokens = await refreshTokensOrRelogin(request, session, tokens);
  }

  // Get user, refreshing tokens if needed.
  const user = buildUser(tokens);

  // Return user with updated session token;
  return {
    user,
    session,
    getSessionToken: (thisSession: typeof session) =>
      userSessionStorage.commitSession(thisSession),
  };
};

export const refreshTokensOrRelogin = async (
  request: Request,
  session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>,
  tokens: Tokens,
  options: {
    returnTo?: string;
  } = {}
) => {
  const { refreshToken } = tokens;
  try {
    const refreshedTokens = await strategy.then((s) =>
      s.refreshToken(refreshToken)
    );
    const tokensResponse = {
      accessToken: refreshedTokens.accessToken(),
      refreshToken: refreshedTokens.refreshToken(),
    };

    // Update session
    session.set("tokens", tokensResponse);

    // Return new tokens
    return tokensResponse;
  } catch (e) {
    logger.warn("Token refresh failed", { details: e });
    throw await getLoginRedirect(request, session, {
      returnTo: options.returnTo,
    });
  }
};
