import { useCallback } from "react";
import { useAuth } from "~/contexts/auth-context";
import { useRequestedAccessContext } from "~/contexts/requested-access-context";
import { buildUrl, isAbsoluteUrl } from "~/lib/urls";
import { isTokenExpired } from "~/lib/users";

export function useAuthenticatedFetch() {
  const { user, apiUrl, refreshAuth } = useAuth();

  const { currentClientId, currentSiteId } = useRequestedAccessContext();

  const fetchAuthenticated = useCallback(
    async (url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      if (typeof url === "string") {
        if (!isAbsoluteUrl(url)) {
          url = buildUrl(url, apiUrl).toString();
        } else if (url.startsWith("self://")) {
          url = url.slice(7);
        }
      }

      let accessToken = user.tokens.accessToken;
      if (isTokenExpired(user.tokens.accessToken)) {
        accessToken = (await refreshAuth()).tokens.accessToken;
      }

      return doFetch(accessToken, url, options, {
        clientId: currentClientId ?? undefined,
        siteId: currentSiteId ?? undefined,
      }).then(async (response) => {
        if (response.status === 401) {
          accessToken = (await refreshAuth()).tokens.accessToken;
          return doFetch(accessToken, url, options);
        }

        return response;
      });
    },
    [refreshAuth, user.tokens.accessToken, apiUrl, currentClientId, currentSiteId]
  );

  const fetchOrThrow = useCallback(
    async (url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      const response = await fetchAuthenticated(url, options);
      if (!response.ok) {
        throw response;
      }

      return response;
    },
    [fetchAuthenticated]
  );

  return {
    fetch: fetchAuthenticated,
    fetchOrThrow: fetchOrThrow,
  };
}

const doFetch = async (
  accessToken: string,
  url: Parameters<typeof fetch>[0],
  options: RequestInit = {},
  { clientId, siteId }: { clientId?: string | null; siteId?: string | null } = {}
) => {
  options.headers = new Headers(options?.headers);
  options.headers.set("Authorization", `Bearer ${accessToken}`);

  if (clientId) {
    options.headers.set("X-Client-Id", clientId);
  }
  if (siteId) {
    options.headers.set("X-Site-Id", siteId);
  }

  return fetch(url, options);
};
