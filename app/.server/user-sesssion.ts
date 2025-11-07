import { createId } from "@paralleldrive/cuid2";
import { redirect } from "react-router";
import { isTokenExpired } from "~/lib/users";
import type { Tokens, User } from "./authenticator";
import { buildUser, strategy } from "./authenticator";
import { logger } from "./logger";
import { clearCookieHeaderValue, setCookieHeaderValue } from "./request-context";
import { userSessionStorage } from "./sessions";

declare global {
  var REFRESH_SESSION_TOKEN_MAP: Map<string, Promise<Tokens>>;
}

globalThis.REFRESH_SESSION_TOKEN_MAP = globalThis.REFRESH_SESSION_TOKEN_MAP ?? new Map();

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
    resHeaders.append("Set-Cookie", await userSessionStorage.commitSession(session));
  }

  // Clear any existing middleware set cookie values.
  clearCookieHeaderValue("authSession");

  return redirect(options.loginRoute ?? "/login", {
    headers: resHeaders,
  });
};

export const getActiveUserSession = async (
  request: Request
): Promise<{
  session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>> | null;
  user: User | null;
}> => {
  let session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>;
  try {
    session = await userSessionStorage.getSession(request.headers.get("cookie"));
  } catch (e) {
    return {
      session: null,
      user: null,
    };
  }

  const tokens = session.get("tokens");
  if (!tokens || isTokenExpired(tokens.accessToken)) {
    return {
      session: null,
      user: null,
    };
  }

  return {
    user: buildUser(tokens),
    session,
  };
};

export const requireUserSession = async (request: Request, options: LoginRedirectOptions = {}) => {
  let session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>;
  try {
    session = await userSessionStorage.getSession(request.headers.get("cookie"));
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
    setCookieHeaderValue("authSession", sessionToken);
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

// Increased timeout to 10 seconds to better handle parallel requests and
// account for network latency. This ensures that multiple simultaneous
// requests can share the same refresh promise.
const REFRESH_TOKEN_PROMISE_TIMEOUT_MS = 10000;

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
    // Check if there's already a refresh in progress for this session
    let tokenPromise = globalThis.REFRESH_SESSION_TOKEN_MAP.get(sessionId);

    if (!tokenPromise) {
      // Create a placeholder promise that we'll set immediately to prevent
      // race conditions where multiple calls check and create promises simultaneously.
      // We'll resolve/reject it in the async operation below.
      let resolvePromise: (tokens: Tokens) => void = () => {};
      let rejectPromise: (error: unknown) => void = () => {};

      tokenPromise = new Promise<Tokens>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
      });

      // Set the promise in the map BEFORE starting the async operation
      // to ensure other concurrent calls will see it and reuse it.
      globalThis.REFRESH_SESSION_TOKEN_MAP.set(sessionId, tokenPromise);

      // Now perform the actual refresh operation
      doRefreshToken(refreshToken)
        .then((refreshedTokens) => {
          resolvePromise(refreshedTokens);
          // Keep promise for REFRESH_TOKEN_PROMISE_TIMEOUT_MS to allow near-simultaneous requests to reuse
          // the same promise. This is especially important for parallel loaders.
          setTimeout(
            () => globalThis.REFRESH_SESSION_TOKEN_MAP.delete(sessionId),
            REFRESH_TOKEN_PROMISE_TIMEOUT_MS
          );
        })
        .catch((e) => {
          logger.warn({ details: e, sessionId, url: request.url }, "Token refresh failed");
          // Remove from map on error so subsequent calls can retry
          globalThis.REFRESH_SESSION_TOKEN_MAP.delete(sessionId);
          rejectPromise(e);
        });
    }

    const tokensResponse = await tokenPromise;

    // Update session
    session.set("tokens", tokensResponse);

    // Return new tokens
    return tokensResponse;
  } catch (e) {
    // In case of an error preventing promise cleanup, make sure it's done now. Otherwise
    // subsequent refreshes will always result in a login redirect (usually resets the user
    // page, which is jarring).
    if (globalThis.REFRESH_SESSION_TOKEN_MAP.has(sessionId)) {
      globalThis.REFRESH_SESSION_TOKEN_MAP.delete(sessionId);
    }
    throw await getLoginRedirect(request, session, options);
  }
};

const doRefreshToken = async (refreshToken: string): Promise<Tokens> => {
  const refreshedTokens = await strategy.then((s) => s.refreshToken(refreshToken));

  return {
    accessToken: refreshedTokens.accessToken(),
    refreshToken: refreshedTokens.refreshToken(),
  };
};
