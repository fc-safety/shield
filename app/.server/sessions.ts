import { deflate, inflate } from "pako";
import {
  createCookieSessionStorage,
  redirect,
  type SessionData,
  type SessionStorage,
  type unstable_MiddlewareFunction,
} from "react-router";
import { createThemeSessionResolver } from "remix-themes";
import type { AppState } from "~/lib/types";
import { isTokenExpired } from "~/lib/users";
import { buildUser, strategy, type Tokens } from "./authenticator";
import { config } from "./config";
import { logger } from "./logger";
import { requestContext } from "./request-context";

const isProduction = process.env.NODE_ENV === "production";
const domain = process.env.APP_DOMAIN;

export const compress = (data: string) =>
  Buffer.from(deflate(data)).toString("base64");

export const decompress = (data: string) =>
  inflate(Buffer.from(data, "base64"), { to: "string" });

export const getSession = async <T = SessionData>(
  request: Request,
  sessionStorage: SessionStorage<T>
) => {
  return sessionStorage.getSession(request.headers.get("cookie"));
};

export const setAndCommitSession = async <T = SessionData>(
  request: Request,
  sessionStorage: SessionStorage<T>,
  key: keyof T & string,
  value: T[keyof T & string]
) => {
  const session = await getSession(request, sessionStorage);
  session.set(key, value);
  return sessionStorage.commitSession(session);
};

export const getSessionValue = async <T = SessionData>(
  request: Request,
  sessionStorage: SessionStorage<T>,
  key: keyof T & string
) => {
  const session = await getSession(request, sessionStorage);
  return session.get(key);
};

export const getSessionValues = async <
  K extends readonly (keyof T & string)[],
  T = SessionData
>(
  request: Request,
  sessionStorage: SessionStorage<T>,
  keys: K
) => {
  const session = await getSession(request, sessionStorage);
  return keys.map(session.get) as {
    [I in keyof K]: K[I] extends keyof T ? T[K[I]] | undefined : undefined;
  };
};

// SESSION MIDDLEWARE

export const setCookieResponseHeaders: unstable_MiddlewareFunction = async (
  { request, params, context },
  next
) => {
  const response = (await next()) as Response;

  const setCookieHeaderValues = requestContext.get("setCookieHeaderValues");

  for (const [key, value] of Object.entries(setCookieHeaderValues)) {
    response.headers.append("Set-Cookie", value);
  }

  return response;
};

// THEME MANAGEMENT

const themeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__remix-themes",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [config.COOKIE_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
  },
});

export const themeSessionResolver =
  createThemeSessionResolver(themeSessionStorage);

// APP STATE STORAGE
export const appStateSessionStorage = createCookieSessionStorage<AppState>({
  cookie: {
    name: "__appState",
    path: "/",
    sameSite: "lax",
  },
});

export const getAppState = async (request: Request) => {
  const session = await appStateSessionStorage.getSession(
    request.headers.get("cookie")
  );
  return session.data;
};

// INSPECTION STORAGE

export interface InspectionCookieValue {
  activeTag?: string;
  tagActivatedOn?: string;
  activeSession?: string;
  activeRoute?: string;
  inspectionToken?: string;
}

export const inspectionSessionStorage =
  createCookieSessionStorage<InspectionCookieValue>({
    cookie: {
      name: "__inspection",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secrets: [config.COOKIE_SECRET],
      ...(isProduction ? { domain, secure: true } : {}),
    },
  });

// USER SESSION MANAGEMENT

export const userSessionStorage = createCookieSessionStorage<{
  tokens?: Tokens | null;
  returnTo?: string;
}>({
  cookie: {
    name: "session",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secrets: [config.SESSION_SECRET],
    ...(isProduction ? { domain, secure: true } : {}),
    decode: (value) => {
      // If decompression fails, return the original value.
      try {
        return decompress(value);
      } catch (e) {
        return value;
      }
    },
    encode: (value) => {
      // Compress to allow for more efficient storage. Tokens
      // can be quite large, and the session is stored in the
      // cookie jar.
      return compress(value);
    },
  },
});

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
    throw await getLoginRedirect(request, session, options);
  }
};
