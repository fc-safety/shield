import { createId } from "@paralleldrive/cuid2";
import { addMinutes, addSeconds } from "date-fns";
import { redirect } from "react-router";
import type { TCapability, TScope } from "~/lib/permissions";
import { isTokenExpired, keycloakTokenPayloadSchema, parseToken } from "~/lib/users";
import type { Tokens, User } from "./authenticator";
import { buildUser, strategy } from "./authenticator";
import { config } from "./config";
import { cookieStore } from "./cookie-store";
import { logger } from "./logger";
import { userSessionStorage } from "./sessions";

declare global {
  var REFRESH_SESSION_TOKEN_MAP: Map<string, Promise<Tokens>>;
}

globalThis.REFRESH_SESSION_TOKEN_MAP = globalThis.REFRESH_SESSION_TOKEN_MAP ?? new Map();

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
}

/**
 * Extract permissions from clientAccess array based on the active client.
 * Priority: 1) storedActiveClientId if valid, 2) primary client, 3) first available
 * Returns null if user has no client access.
 */
export function extractPermissionsFromClientAccess(
  clientAccess: ClientAccessEntry[],
  storedActiveClientId?: string | null
): {
  scope: TScope;
  capabilities: TCapability[];
  hasMultiClientScope: boolean;
  hasMultiSiteScope: boolean;
  activeClientId: string | null;
  activeSiteId: string | null;
} | null {
  if (clientAccess.length === 0) {
    return null;
  }

  // Find the active client
  let activeClient: ClientAccessEntry | undefined;

  // 1. Try to use stored active client ID
  if (storedActiveClientId) {
    activeClient = clientAccess.find((c) => c.clientId === storedActiveClientId);
  }

  // 2. Fallback to primary client
  if (!activeClient) {
    activeClient = clientAccess.find((c) => c.isPrimary);
  }

  // 3. Fallback to first available
  if (!activeClient) {
    activeClient = clientAccess[0];
  }

  // Compute hasMultiClientScope: user has access to multiple unique clients
  const uniqueClientIds = new Set(clientAccess.map((c) => c.clientId));
  const hasMultiClientScope = uniqueClientIds.size > 1;

  // Compute hasMultiSiteScope: user has access to multiple unique sites
  const uniqueSiteIds = new Set(clientAccess.map((c) => c.siteId));
  const hasMultiSiteScope = uniqueSiteIds.size > 1;

  return {
    scope: activeClient.role.scope,
    capabilities: activeClient.role.capabilities,
    hasMultiClientScope,
    hasMultiSiteScope,
    activeClientId: activeClient.clientId,
    activeSiteId: activeClient.siteId,
  };
}

export async function fetchCurrentUser(
  accessToken: string,
  { clientId, siteId }: { clientId?: string | null; siteId?: string | null } = {}
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
  const response = await fetch(`${config.API_BASE_URL}/auth/me`, {
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

  return redirect(options.loginRoute ?? "/login");
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

  const scope = session.get("scope");
  const capabilities = session.get("capabilities");

  return {
    user: buildUser(tokens, {
      scope: scope ?? "SELF",
      capabilities: capabilities ?? ([] as TCapability[]),
      hasMultiClientScope: session.get("hasMultiClientScope") ?? false,
      hasMultiSiteScope: session.get("hasMultiSiteScope") ?? false,
      activeClientId: session.get("activeClientId") ?? null,
      activeSiteId: session.get("activeSiteId") ?? null,
    }),
    session,
  };
};

export const commitUserSession = async (
  session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>
) => {
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

export const requireUserSession = async (request: Request, options: LoginRedirectOptions = {}) => {
  let session: Awaited<ReturnType<(typeof userSessionStorage)["getSession"]>>;
  try {
    session = await userSessionStorage.getSession(request.headers.get("cookie"));
  } catch (e) {
    throw redirect("/logout");
  }

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
    await commitUserSession(session);
  }

  // Get stored permission data
  let scope = session.get("scope");
  let capabilities = session.get("capabilities");
  let hasMultiClientScope = session.get("hasMultiClientScope");
  let hasMultiSiteScope = session.get("hasMultiSiteScope");
  let activeClientId = session.get("activeClientId");
  let activeSiteId = session.get("activeSiteId");

  // If not stored, fetch from backend
  if (!scope || !capabilities) {
    try {
      const currentUser = await fetchCurrentUser(tokens.accessToken, {
        clientId: activeClientId,
        siteId: activeSiteId,
      });

      if (currentUser.accessGrant) {
        const result = applyAccessGrantToSession(session, currentUser.accessGrant);
        ({
          scope,
          capabilities,
          hasMultiClientScope,
          hasMultiSiteScope,
          activeClientId,
          activeSiteId,
        } = result);
        await commitUserSession(session);
      } else if (!options.allowEmptyAccessGrant) {
        await commitUserSession(session);
        throw redirect("/no-access");
      }
    } catch (error) {
      // Re-throw redirects (e.g. /no-access redirect for null accessGrant)
      if (error instanceof Response) throw error;

      logger.error({ error }, "Failed to fetch current user");
      throw redirect("/login?error=backend_unavailable");
    }
  }

  const user = buildUser(tokens, {
    scope: scope ?? "SELF",
    capabilities: capabilities ?? ([] as TCapability[]),
    hasMultiClientScope: hasMultiClientScope ?? false,
    hasMultiSiteScope: hasMultiSiteScope ?? false,
    activeClientId: activeClientId ?? null,
    activeSiteId: activeSiteId ?? null,
  });

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

    // Also refresh permissions when tokens are refreshed
    try {
      const currentUser = await fetchCurrentUser(tokensResponse.accessToken, {
        clientId: session.get("activeClientId"),
        siteId: session.get("activeSiteId"),
      });

      if (!currentUser.accessGrant) {
        throw redirect("/no-access");
      }

      applyAccessGrantToSession(session, currentUser.accessGrant);
    } catch (error) {
      if (error instanceof Response) throw error;

      logger.warn({ error }, "Failed to refresh permissions after token refresh");
      // Keep existing permissions
    }

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
