import { useCallback, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import type { User } from "~/.server/authenticator";
import { useAuth } from "~/contexts/auth-context";
import { buildUrl } from "~/lib/urls";
import { isTokenExpired } from "~/lib/users";

// Add this outside the hook to share across all instances
let pendingRefresh: Promise<User> | null = null;

export function useAuthenticatedFetch() {
  const fetcher = useFetcher<User>();
  const resolveAuthRefresh = useRef<((user: User) => void) | null>(null);
  const { user, apiUrl } = useAuth();

  const refreshAuth = useCallback(() => {
    // If there's already a refresh in progress, return that Promise
    if (pendingRefresh) {
      return pendingRefresh;
    }

    // Create new refresh Promise and store it
    pendingRefresh = new Promise<User>((resolve) => {
      resolveAuthRefresh.current = resolve;
    });

    fetcher.submit(null, {
      method: "POST",
      action: getRefreshAuthAction(),
    });

    return pendingRefresh;
  }, [fetcher]);

  useEffect(() => {
    if (
      resolveAuthRefresh.current &&
      fetcher.state === "idle" &&
      fetcher.data
    ) {
      resolveAuthRefresh.current(fetcher.data);
      resolveAuthRefresh.current = null;
      // Clear the pending refresh after it's complete
      pendingRefresh = null;
    }
  }, [fetcher.state, fetcher.data]);

  const fetchAuthenticated = useCallback(
    async (url: string, options?: RequestInit) => {
      if (!isAbsoluteUrl(url)) {
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
    async (url: string, options: RequestInit) => {
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

const getRefreshAuthAction = () =>
  typeof document !== "undefined"
    ? `/action/refresh-auth?returnTo=${window.location.href}`
    : "/action/refresh-auth";

const doFetch = async (
  accessToken: string,
  url: string,
  options: RequestInit = {}
) => {
  options.headers = new Headers(options?.headers);
  options.headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(url, options);
};

const isAbsoluteUrl = (url: string) => {
  return url.startsWith("http://") || url.startsWith("https://");
};
