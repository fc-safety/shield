import { createId } from "@paralleldrive/cuid2";
import { addMinutes, addSeconds } from "date-fns";
import { redirect } from "react-router";
import type { TCapability, TScope } from "~/lib/permissions";
import type { ActiveAccessGrant } from "~/lib/types";
import { buildPath, buildUrl } from "~/lib/urls";
import { isTokenExpired, keycloakTokenPayloadSchema, parseToken } from "~/lib/users";
import type { Tokens, User } from "./authenticator";
import { buildUser, strategy } from "./authenticator";
import { config } from "./config";
import { cookieStore } from "./cookie-store";
import { logger } from "./logger";
import { getAppState, getSession, setAppState, userSessionStorage } from "./sessions";

declare global {
  var inFlightTokenRefresh: Map<string, Promise<Tokens>>;
}

globalThis.inFlightTokenRefresh = globalThis.inFlightTokenRefresh ?? new Map();

export interface ClientAccessEntry {
  clientId: string;
  clientName: string;
  clientExternalId: string;
  siteId: string;
  siteName: string;
  isPrimary: boolean;
  role: {
    id: string;
    name: string;
    scope: TScope;
    capabilities: TCapability[];
  };
}

export interface CurrentUserResponse {
  // Identity info from token
  idpId: string;
  email: string;
  username: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  personId: string | null;
  accessGrant: AccessGrant | null;
}

export interface AccessGrant {
  scope: TScope;
  capabilities: TCapability[];
  clientId: string;
  siteId: string;
  roleId: string;
}

export interface FetchCurrentUserOptions {
  clientId?: string | null;
  siteId?: string | null;
}

async function fetchCurrentUser(
  accessToken: string,
  { clientId, siteId }: FetchCurrentUserOptions = {}
): Promise<CurrentUserResponse> {
  const headers = new Headers({
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  });
  if (clientId) {
    headers.set("X-Client-Id", clientId);
  }
  if (siteId) {
    headers.set("X-Site-Id", siteId);
  }
  const response = await fetch(buildUrl("/auth/me", config.API_BASE_URL), {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.status}`);
  }

  return response.json();
}

/**
 * Apply access grant data to the user session. Handles null accessGrant gracefully
 * (defaults to SELF scope with no capabilities). Accepts optional overrides for
 * activeClientId/activeSiteId (used by switch-client to set these from the request body
 * rather than the fetched user response).
 *
 * Returns the computed values so callers can use them for buildUser() without
 * re-reading the session.
 */
export function applyAccessGrantToSession(
  session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>,
  accessGrant: AccessGrant
) {
  const scope = accessGrant.scope;
  const capabilities = accessGrant.capabilities;
  const hasMultiClientScope = ["SYSTEM", "GLOBAL"].includes(scope);
  const hasMultiSiteScope = ["SYSTEM", "GLOBAL", "CLIENT"].includes(scope);
  const activeClientId = accessGrant.clientId;
  const activeSiteId = accessGrant.siteId;

  session.set("scope", scope);
  session.set("capabilities", capabilities);
  session.set("hasMultiClientScope", hasMultiClientScope);
  session.set("hasMultiSiteScope", hasMultiSiteScope);
  session.set("activeClientId", activeClientId);
  session.set("activeSiteId", activeSiteId);

  return {
    scope,
    capabilities,
    hasMultiClientScope,
    hasMultiSiteScope,
    activeClientId,
    activeSiteId,
  };
}

export interface LoginRedirectOptions {
  allowEmptyAccessGrant?: boolean;
  returnTo?: string;
  loginRoute?: string;
  errorCode?: string;
  errorMessage?: string;
}

export const getLoginRedirect = async (
  request: Request,
  session?: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>,
  options: LoginRedirectOptions = {}
) => {
  if (session) {
    // If auth session exists, set return to and commit session.
    session.set("returnTo", options.returnTo ?? request.url);
    await commitUserSession(session);
  } else {
    // Otherwise, reset the auth session.
    cookieStore.unset("authSession");
  }

  const loginUrl = buildPath(options.loginRoute ?? "/login", {
    error: options.errorCode,
    error_description: options.errorMessage,
  });

  return redirect(loginUrl);
};

export type UserSession = Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>;

export type GetUserSessionOptions = {
  session?: UserSession;
};

export type GetUserSessionResult =
  | {
      isValid: true;
      sessionId: string;
      session: UserSession;
      tokens: Tokens;
      user: User;
      message?: never;
      reason?: never;
    }
  | {
      isValid: false;
      reason: "missing_tokens";
      message: string;
      sessionId: string;
      session: UserSession;
      tokens?: never;
      user?: never;
    }
  | {
      isValid: false;
      reason: "expired_tokens";
      message: string;
      sessionId: string;
      session: UserSession;
      tokens: Tokens;
      user: User;
    }
  | {
      isValid: false;
      reason: "unavailable";
      message: string;
      sessionId?: never;
      session?: never;
      tokens?: never;
      user?: never;
    };

export const getUserSession = async (
  request: Request,
  options: GetUserSessionOptions = {}
): Promise<GetUserSessionResult> => {
  let session: UserSession;
  if (options.session) {
    session = options.session;
  } else {
    // Try to use in-flight session first from previous commits.
    let inFlightSession: UserSession | null = null;
    try {
      const committedSession = cookieStore.get("authSession");
      if (committedSession) {
        inFlightSession = await userSessionStorage.getSession(committedSession);
      }
    } catch (e) {}

    if (inFlightSession) {
      session = inFlightSession;
    } else {
      try {
        session = await getSession(request, userSessionStorage);
      } catch (e) {
        return {
          isValid: false,
          reason: "unavailable",
          message: "Failed to get user session from request cookies.",
        };
      }
    }
  }

  let appStateAccessGrant: ActiveAccessGrant | null = null;
  try {
    appStateAccessGrant = await getAppState(request).then(
      (appState) => appState.activeAccessGrant ?? null
    );
  } catch (error) {
    logger.error(error, "Failed to get app state session from request cookies.");
  }

  // Get or set unique session ID for this session.
  let sessionId = session.get("id");
  if (!sessionId) {
    sessionId = createId();
    session.set("id", sessionId);
  }

  const tokens = session.get("tokens");
  if (!tokens) {
    return {
      isValid: false,
      reason: "missing_tokens",
      message: "No tokens found in user session.",
      session,
      sessionId,
    };
  }

  const sessionData = session.data;
  const user = buildUser(tokens, {
    scope: sessionData.scope ?? "SELF",
    capabilities: sessionData.capabilities ?? ([] as TCapability[]),
    hasMultiClientScope: sessionData.hasMultiClientScope ?? false,
    hasMultiSiteScope: sessionData.hasMultiSiteScope ?? false,
    activeClientId: sessionData.activeClientId ?? appStateAccessGrant?.clientId ?? null,
    activeSiteId: sessionData.activeSiteId ?? appStateAccessGrant?.siteId ?? null,
  });

  if (isTokenExpired(tokens.accessToken)) {
    return {
      isValid: false,
      reason: "expired_tokens",
      message: "Access token is expired.",
      session,
      sessionId,
      tokens,
      user,
    };
  }

  return {
    isValid: true,
    user,
    session,
    sessionId,
    tokens,
  };
};

export const commitUserSession = async (session: UserSession) => {
  const tokens = session.get("tokens");
  // Default expire in 10 minutes of no tokens are present.
  let expiresAt = addMinutes(new Date(), 10);
  if (tokens) {
    const parsedAccessToken = parseToken(
      tokens.accessToken,
      keycloakTokenPayloadSchema.pick({ exp: true, iat: true })
    );
    const expiresInSeconds = parsedAccessToken.exp - parsedAccessToken.iat;
    expiresAt = addSeconds(expiresAt, expiresInSeconds + 60); // Add 60 seconds to allow for clock skew.
  }

  const sessionCookie = await userSessionStorage.commitSession(session, { expires: expiresAt });
  cookieStore.set("authSession", sessionCookie);
  return sessionCookie;
};

export type RefreshUserSessionOptions = FetchCurrentUserOptions &
  GetUserSessionOptions & { roleId?: string };

type RefreshUserSessionResult =
  | {
      success: true;
      session: UserSession;
      user: User;
      tokens: Tokens;
      accessGrant: AccessGrant | null;
      message?: never;
      reason?: never;
      cause?: never;
    }
  | {
      success: false;
      session?: UserSession;
      tokens?: Tokens;
      user?: User;
      accessGrant?: never;
      reason: "token_refresh_failed" | "invalid_session" | "access_grant_fetch_failed";
      message: string;
      cause?: unknown;
    };

export const refreshUserSession = async (
  request: Request,
  options: RefreshUserSessionOptions = {}
): Promise<RefreshUserSessionResult> => {
  const { session, sessionId, user, isValid, reason, tokens } = await getUserSession(request, {
    session: options.session,
  });

  let validTokens: Tokens;

  if (isValid) {
    validTokens = tokens;
  } else {
    if (reason === "expired_tokens") {
      try {
        const refreshedTokens = await getRefreshedTokens(tokens.refreshToken, sessionId);
        session.set("tokens", refreshedTokens);
        validTokens = refreshedTokens;
      } catch (error) {
        // Token refresh failure is often a result of invalid or expired refresh token.
        // The solution is usually to re-authenticate the user.
        return {
          success: false,
          session,
          tokens,
          user,
          reason: "token_refresh_failed",
          message: "Failed to refresh tokens.",
          cause: error,
        };
      }
    } else {
      // Session is invalid, so we need to re-authenticate the user.
      return {
        success: false,
        session,
        tokens,
        user,
        reason: "invalid_session",
        message: "Session is invalid.",
      };
    }
  }

  let accessGrant: AccessGrant | null = null;

  try {
    const currentUser = await fetchCurrentUser(validTokens.accessToken, {
      clientId: options.clientId ?? user.activeClientId,
      siteId: options.siteId ?? user.activeSiteId,
    });

    if (currentUser.accessGrant) {
      accessGrant = currentUser.accessGrant;
      applyAccessGrantToSession(session, currentUser.accessGrant);
      await commitUserSession(session);

      // Additionally, set the app state to use the current users's access grant.
      await setAppState(request, {
        activeAccessGrant: {
          clientId: accessGrant.clientId,
          siteId: accessGrant.siteId,
          roleId: options.roleId ?? accessGrant.roleId,
        },
      }).catch((error) => {
        logger.error(error, "Failed to set app state to use the current users's access grant.");
        // Don't throw error, as this is not critical. We don't want to interrupt or block the user's flow.
      });
    }
  } catch (error) {
    const msg = "Failed to fetch access grant for current user.";
    logger.error(error, msg);

    return {
      success: false,
      session,
      tokens,
      user,
      reason: "access_grant_fetch_failed",
      message: msg,
      cause: error,
    };
  }

  const refreshedUser = buildUser(validTokens, {
    scope: session.get("scope") ?? "SELF",
    capabilities: session.get("capabilities") ?? ([] as TCapability[]),
    hasMultiClientScope: session.get("hasMultiClientScope") ?? false,
    hasMultiSiteScope: session.get("hasMultiSiteScope") ?? false,
    activeClientId: session.get("activeClientId") ?? null,
    activeSiteId: session.get("activeSiteId") ?? null,
  });

  return {
    success: true,
    session,
    user: refreshedUser,
    tokens: validTokens,
    accessGrant,
  };
};

export const refreshUserSessionOrReauthenticate = async (
  request: Request,
  options: LoginRedirectOptions = {}
): Promise<RefreshUserSessionResult & { success: true }> => {
  const result = await refreshUserSession(request);
  if (result.success) {
    return result;
  } else {
    if (result.reason === "access_grant_fetch_failed") {
      options.errorCode = result.reason;
      options.errorMessage = result.message;
    }
    throw await getLoginRedirect(request, result.session, options);
  }
};

export const requireUserSession = async (request: Request, options: LoginRedirectOptions = {}) => {
  let session: UserSession;
  let user: User;
  let tokens: Tokens;

  const result = await getUserSession(request);
  if (!result.isValid) {
    const refreshResult = await refreshUserSessionOrReauthenticate(request, options);

    session = refreshResult.session;
    user = refreshResult.user;
    tokens = refreshResult.tokens;

    if (!refreshResult.accessGrant && !options.allowEmptyAccessGrant) {
      throw redirect("/no-access");
    }
  } else {
    session = result.session;
    user = result.user;
    tokens = result.tokens;
  }

  // Return user with updated session token;
  return {
    user,
    session,
  };
};

// Increased timeout to 10 seconds to better handle parallel requests and
// account for network latency. This ensures that multiple simultaneous
// requests can share the same refresh promise.
const REFRESH_TOKEN_PROMISE_TIMEOUT_MS = 10000;

const getRefreshedTokens = async (refreshToken: string, sessionId: string): Promise<Tokens> => {
  let promise = globalThis.inFlightTokenRefresh.get(sessionId);

  if (!promise) {
    promise = strategy
      .then((s) => s.refreshToken(refreshToken))
      .then((refreshedTokens) => {
        setTimeout(() => {
          globalThis.inFlightTokenRefresh.delete(sessionId);
        }, REFRESH_TOKEN_PROMISE_TIMEOUT_MS);

        return {
          accessToken: refreshedTokens.accessToken(),
          refreshToken: refreshedTokens.refreshToken(),
        };
      })
      .catch((e) => {
        globalThis.inFlightTokenRefresh.delete(sessionId);
        throw e;
      });

    globalThis.inFlightTokenRefresh.set(sessionId, promise);
  }

  return promise;
};
