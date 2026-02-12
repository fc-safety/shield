import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from "react";
import { useRevalidator } from "react-router";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { getMyClientAccessQueryOptions } from "~/lib/services/client-access.service";
import type { ActiveAccessGrant, MyClientAccess } from "~/lib/types";
import { useAppState } from "./app-state-context";
import { useAuth } from "./auth-context";

function accessGrantMatches(a: ActiveAccessGrant, b: MyClientAccess): boolean {
  return a.clientId === b.clientId && a.siteId === b.siteId && a.roleId === b.roleId;
}

function toActiveAccessGrant(access: MyClientAccess): ActiveAccessGrant {
  return { clientId: access.clientId, siteId: access.siteId, roleId: access.roleId };
}

interface ActiveAccessGrantContextValue {
  /** All access grants the user has */
  accessibleClients: MyClientAccess[];
  /** The currently active access grant (composite key) */
  activeAccessGrant: ActiveAccessGrant | null;
  /** The currently active client access record */
  activeClient: MyClientAccess | null;
  /** Switch to a different access grant */
  setActiveAccessGrant: (grant: ActiveAccessGrant) => Promise<void>;
  /** Whether the client access data is loading */
  isLoading: boolean;
  /** Whether the user has multiple access grants */
  hasMultipleAccessGrants: boolean;
  /** Refetch the accessible clients */
  refetchClients: () => Promise<void>;
  /** Whether to disable the ability to switch access grants */
  disableSwitching: boolean;
}

const ActiveAccessGrantContext = createContext<ActiveAccessGrantContextValue | null>(null);

export function ActiveAccessGrantProvider({
  children,
  disableSwitching,
}: PropsWithChildren<{ disableSwitching?: boolean }>) {
  const { refreshAuth } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { appState, setAppState } = useAppState();
  const { revalidate } = useRevalidator();
  const queryClient = useQueryClient();

  // Fetch accessible clients
  const {
    data: accessibleClients,
    isLoading,
    refetch,
  } = useQuery(getMyClientAccessQueryOptions(fetchOrThrow));

  // Get the active access grant from app state, or default to first client
  const activeAccessGrant = useMemo(() => {
    if (!accessibleClients) {
      return null;
    }

    // If we have a stored active access grant, use it
    if (appState.activeAccessGrant) {
      // Verify the stored grant is still valid (user still has access)
      const hasAccess = accessibleClients.some((c) =>
        accessGrantMatches(appState.activeAccessGrant!, c)
      );
      if (hasAccess) {
        return appState.activeAccessGrant;
      }
    }

    // Default to first client
    const first = accessibleClients[0];
    return first ? toActiveAccessGrant(first) : null;
  }, [appState.activeAccessGrant, accessibleClients]);

  // Refresh auth if stored access grant is no longer valid (must be in useEffect, not useMemo,
  // because refreshAuth uses router.fetch() which is unavailable during SSR)
  const storedGrantIsStale = Boolean(
    appState.activeAccessGrant &&
    accessibleClients &&
    !accessibleClients.some((c) => accessGrantMatches(appState.activeAccessGrant!, c))
  );
  const hasRefreshedForStaleGrant = useRef(false);

  useEffect(() => {
    if (storedGrantIsStale && !hasRefreshedForStaleGrant.current) {
      hasRefreshedForStaleGrant.current = true;
      refreshAuth().catch((e) =>
        console.error("ActiveAccessGrantProvider: failed to refresh auth", e)
      );
    } else if (!storedGrantIsStale) {
      hasRefreshedForStaleGrant.current = false;
    }
  }, [storedGrantIsStale, refreshAuth]);

  // Get the full active client record
  const activeClient = useMemo(
    () =>
      activeAccessGrant && accessibleClients
        ? (accessibleClients.find((c) => accessGrantMatches(activeAccessGrant, c)) ?? null)
        : null,
    [accessibleClients, activeAccessGrant]
  );

  // When accessible clients load and no active access grant is set, set the default
  useEffect(() => {
    if (!appState.activeAccessGrant && activeAccessGrant) {
      setAppState({ activeAccessGrant });
    }
  }, [appState.activeAccessGrant, activeAccessGrant, setAppState]);

  // Switch to a different access grant
  const setActiveAccessGrant = useCallback(
    async (grant: ActiveAccessGrant) => {
      // Verify user has access to this grant
      const clientAccess = (accessibleClients ?? []).find((c) => accessGrantMatches(grant, c));
      if (!clientAccess) {
        throw new Error("You do not have access to this client");
      }

      // Call the server action to update session permissions
      const response = await fetch("/action/switch-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: grant.clientId,
          siteId: grant.siteId,
          roleId: grant.roleId,
        }),
      });

      if (!response.ok) {
        let message = "Failed to switch client";
        try {
          const error = await response.json();
          message = error.error ?? message;
        } catch {
          // response body was not JSON
        }
        throw new Error(message);
      }

      // Update app state
      await setAppState({ activeAccessGrant: grant });

      // Cancel in-flight queries and clear the cache so stale queries from the
      // previous (potentially more permissive) context don't refetch and 403.
      // Mounted components will naturally re-trigger their own queries.
      await queryClient.cancelQueries();
      queryClient.removeQueries();

      // Revalidate React Router loaders
      revalidate();
    },
    [accessibleClients, setAppState, queryClient, revalidate]
  );

  const refetchClients = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const hasMultipleAccessGrants = (accessibleClients ?? []).length > 1;

  const value: ActiveAccessGrantContextValue = {
    accessibleClients: accessibleClients ?? [],
    activeAccessGrant,
    activeClient,
    setActiveAccessGrant,
    isLoading,
    hasMultipleAccessGrants,
    refetchClients,
    disableSwitching: disableSwitching ?? false,
  };

  return (
    <ActiveAccessGrantContext.Provider value={value}>{children}</ActiveAccessGrantContext.Provider>
  );
}

export function useActiveAccessGrant() {
  const context = useContext(ActiveAccessGrantContext);
  if (!context) {
    throw new Error("useActiveAccessGrant must be used within an ActiveAccessGrantProvider");
  }
  return context;
}

/**
 * Returns the ActiveAccessGrantContext value, or null if not inside a ActiveAccessGrantProvider.
 * Use this in components that may render outside the authenticated layout.
 */
export function useOptionalActiveAccessGrant() {
  return useContext(ActiveAccessGrantContext);
}

/**
 * Hook to get the active client ID for API calls.
 * Returns null if user only has one access grant (no header needed).
 * Returns the client ID if user has multiple access grants.
 */
export function useActiveClientHeader(): string | null {
  const context = useContext(ActiveAccessGrantContext);

  // If not in a ActiveAccessGrantProvider, return null (no header)
  if (!context) {
    return null;
  }

  // Only return client ID if user has multiple access grants
  if (!context.hasMultipleAccessGrants) {
    return null;
  }

  return context.activeAccessGrant?.clientId ?? null;
}
