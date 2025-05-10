import { useCallback } from "react";
import { useAuth } from "~/contexts/auth-context";
import { buildUrl, isAbsoluteUrl } from "~/lib/urls";
import { isTokenExpired } from "~/lib/users";

export function useAuthenticatedFetch() {
  const { user, apiUrl, refreshAuth } = useAuth();

  const fetchAuthenticated = useCallback(
    async (url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      if (typeof url === "string" && !isAbsoluteUrl(url)) {
        url = buildUrl(url, apiUrl).toString();
      }

      let accessToken = user.tokens.accessToken;
      if (isTokenExpired(user.tokens.accessToken)) {
        accessToken = (await refreshAuth()).tokens.accessToken;
      }

      return doFetch(accessToken, url, options).then(async (response) => {
        if (response.status === 401) {
          accessToken = (await refreshAuth()).tokens.accessToken;
          return doFetch(accessToken, url, options);
        }

        return response;
      });
    },
    [refreshAuth, user.tokens.accessToken, apiUrl]
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
  options: RequestInit = {}
) => {
  options.headers = new Headers(options?.headers);
  options.headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(url, options);
};
