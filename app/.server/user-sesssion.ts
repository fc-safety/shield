import { createId } from "@paralleldrive/cuid2";
import { redirect } from "react-router";
import { isTokenExpired } from "~/lib/users";
import type { Tokens } from "./authenticator";
import { buildUser, strategy } from "./authenticator";
import { logger } from "./logger";
import { requestContext } from "./request-context";
import { userSessionStorage } from "./sessions";

declare global {
  var REFRESH_SESSION_TOKEN_MAP: Map<string, Promise<Tokens>>;
}

globalThis.REFRESH_SESSION_TOKEN_MAP =
  globalThis.REFRESH_SESSION_TOKEN_MAP ?? new Map();

export interface LoginRedirectOptions {
  returnTo?: string;
  loginRoute?: string;
}

export const getLoginRedirect = async (
  request: Request,
  session?: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>,
  options: LoginRedirectOptions = {}
) => {
  const resHeaders = new Headers({});

  if (session) {
    session.set("returnTo", options.returnTo ?? request.url);
    resHeaders.append(
      "Set-Cookie",
      await userSessionStorage.commitSession(session)
    );
  }

  // Clear any existing middleware set cookie values.
  requestContext.set("setCookieHeaderValues", (values) => {
    const newValues = { ...values };
    delete newValues.authSession;
    return newValues;
  });

  return redirect(options.loginRoute ?? "/login", {
    headers: resHeaders,
  });
};

export const requireUserSession = async (
  request: Request,
  options: LoginRedirectOptions = {}
) => {
  let session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>;
  try {
    session = await userSessionStorage.getSession(
      request.headers.get("cookie")
    );
  } catch (e) {
    throw redirect("/logout");
  }

  const getSessionToken = (thisSession: typeof session) =>
    userSessionStorage.commitSession(thisSession);

  let tokens = session.get("tokens");
  if (!tokens) {
    throw await getLoginRedirect(request, session, options);
  }

  // Preemptively check token to provide a more consistent and earlier reauth
  // experience if needed. If a page requires the user session but makes no API calls,
  // the reauth woudln't happen until after the first API call, which was somewhat jarring.
  // Now both checks are made: 1) refresh preemptively if token is expired or 2) refresh
  // if 401 is received from API.
  if (isTokenExpired(tokens.accessToken)) {
    // Refresh tokens and update session.
    tokens = await refreshTokensOrRelogin(request, session, tokens, options);
    session.set("tokens", tokens);

    // Update session cookie.
    const sessionToken = await getSessionToken(session);
    requestContext.set("setCookieHeaderValues", (values) => ({
      ...values,
      authSession: sessionToken,
    }));
  }

  // Get user, refreshing tokens if needed.
  const user = buildUser(tokens);

  // Return user with updated session token;
  return {
    user,
    session,
    getSessionToken,
  };
};

export const refreshTokensOrRelogin = async (
  request: Request,
  session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>,
  tokens: Tokens,
  options: LoginRedirectOptions = {}
) => {
  const { refreshToken } = tokens;
  let sessionId = session.get("id");

  if (!sessionId) {
    sessionId = createId();
    session.set("id", sessionId);
  }

  try {
    let tokenPromise = globalThis.REFRESH_SESSION_TOKEN_MAP.get(sessionId);
    if (!tokenPromise) {
      tokenPromise = new Promise(async (resolve) => {
        const tokens = await doRefreshToken(refreshToken);
        globalThis.REFRESH_SESSION_TOKEN_MAP.delete(sessionId);
        resolve(tokens);
      });
      globalThis.REFRESH_SESSION_TOKEN_MAP.set(sessionId, tokenPromise);
    }

    const tokensResponse = await tokenPromise;

    // Update session
    session.set("tokens", tokensResponse);

    // Return new tokens
    return tokensResponse;
  } catch (e) {
    logger.warn("Token refresh failed", { details: e });
    throw await getLoginRedirect(request, session, options);
  }
};

const doRefreshToken = async (refreshToken: string): Promise<Tokens> => {
  const refreshedTokens = await strategy.then((s) =>
    s.refreshToken(refreshToken)
  );

  return {
    accessToken: refreshedTokens.accessToken(),
    refreshToken: refreshedTokens.refreshToken(),
  };
};
