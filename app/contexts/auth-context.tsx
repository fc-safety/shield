import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useEventListener, useInterval } from "usehooks-ts";
import type { User } from "~/.server/authenticator";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { buildUrl } from "~/lib/urls";
import { isTokenExpired } from "~/lib/users";

export const ANONYMOUS_USER: User = {
  idpId: "anonymous",
  email: "anonymous@shield.com",
  username: "anonymous",
  name: "Anonymous",
  givenName: "Anonymous",
  familyName: "Anonymous",
  picture: "https://shield.com/anonymous.png",
  clientId: "",
  siteId: "",
  tokens: {
    accessToken: "anonymous",
    refreshToken: "anonymous",
  },
};

// Add this outside the hook to share across all instances.
let pendingRefresh: Promise<User> | null = null;

const AuthContext = createContext<{
  user: User;
  apiUrl: string;
  appHost: string;
  googleMapsApiKey: string;
  clientId: string;
  refreshAuth: () => Promise<User>;
} | null>(null);

export const AuthProvider = ({
  children,
  user: userProp,
  apiUrl,
  appHost,
  googleMapsApiKey,
  clientId,
}: PropsWithChildren<{
  user: User;
  apiUrl: string;
  appHost: string;
  googleMapsApiKey: string;
  clientId: string;
}>) => {
  const [user, setUser] = useState(userProp);

  const resolveAuthRefresh = useRef<((user: User) => void) | null>(null);
  const { submitJson: submitRefreshAuth } = useModalFetcher<User>({
    onSubmitted: (user) => {
      if (resolveAuthRefresh.current) {
        resolveAuthRefresh.current(user);
        resolveAuthRefresh.current = null;
        // Clear the pending refresh after it's complete
        pendingRefresh = null;

        // Set new user data;
        setUser(user);
      }
    },
  });

  const documentRef = useRef<Document>(getDocument());

  const refreshAuth = useCallback(() => {
    // If there's already a refresh in progress, return that Promise
    if (pendingRefresh) {
      return pendingRefresh;
    }

    // Create new refresh Promise and store it
    pendingRefresh = new Promise<User>((resolve) => {
      resolveAuthRefresh.current = resolve;
    });

    submitRefreshAuth(null, {
      method: "POST",
      path: getRefreshAuthAction(),
    });

    return pendingRefresh;
  }, [submitRefreshAuth]);

  const refreshAuthIfNeeded = useCallback(() => {
    if (documentRef.current.visibilityState === "hidden") {
      return;
    }

    if (!isTokenExpired(user.tokens.accessToken)) {
      return;
    }

    refreshAuth();
  }, [user.tokens.accessToken, refreshAuth]);

  // Every 30 seconds, check if the access token is expired and refresh it if it is.
  useInterval(refreshAuthIfNeeded, 1000 * CHECK_ACCESS_TOKEN_INTERVAL_SECONDS);

  // Every time the document becomes visible, refresh token if needed.
  useEventListener("visibilitychange", refreshAuthIfNeeded, documentRef);

  const userIdentified = useRef(false);
  useEffect(() => {
    if (userIdentified.current) {
      return;
    }

    userIdentified.current = true;
    fetch(buildUrl("/support/identify", apiUrl), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.tokens.accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to identify user.");
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          (window as any).Beacon("identify", data);
        }
      })
      .catch((err) => {
        console.error("Failed to identify user.", err);
      });
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, refreshAuth, apiUrl, appHost, googleMapsApiKey, clientId }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return auth;
};

const CHECK_ACCESS_TOKEN_INTERVAL_SECONDS = 30;

const getRefreshAuthAction = () =>
  typeof document !== "undefined"
    ? `/action/refresh-auth?returnTo=${encodeURIComponent(window.location.href)}`
    : "/action/refresh-auth";

const getDocument = () => {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return document;
  }
  return {
    visibilityState: "hidden",
  } as Document;
};
