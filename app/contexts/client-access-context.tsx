import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from "react";
import { useRevalidator } from "react-router";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { getMyClientAccessQueryOptions } from "~/lib/services/client-access.service";
import type { ClientAccess } from "~/lib/types";
import { useAppState } from "./app-state-context";

interface ClientAccessContextValue {
  /** All clients the user can access */
  accessibleClients: ClientAccess[];
  /** The currently active client ID (external ID) */
  activeClientId: string | null;
  /** The currently active client access record */
  activeClient: ClientAccess | null;
  /** Switch to a different client */
  setActiveClient: (clientExternalId: string) => Promise<void>;
  /** Whether the client access data is loading */
  isLoading: boolean;
  /** Whether the user has access to multiple clients */
  hasMultipleClients: boolean;
  /** Refetch the accessible clients */
  refetchClients: () => Promise<void>;
}

const ClientAccessContext = createContext<ClientAccessContextValue | null>(null);

export function ClientAccessProvider({ children }: PropsWithChildren) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { appState, setAppState } = useAppState();
  const { revalidate } = useRevalidator();
  const queryClient = useQueryClient();

  // Fetch accessible clients
  const {
    data: accessibleClients = [],
    isLoading,
    refetch,
  } = useQuery(getMyClientAccessQueryOptions(fetchOrThrow));

  // Get the active client ID from app state, or default to primary client
  const activeClientId = useMemo(() => {
    // If we have a stored active client ID, use it
    if (appState.activeClientId) {
      // Verify the stored ID is still valid (user still has access)
      const hasAccess = accessibleClients.some(
        (c) => c.client.externalId === appState.activeClientId
      );
      if (hasAccess) {
        return appState.activeClientId;
      }
    }

    // Default to primary client, or first client if no primary
    const primary = accessibleClients.find((c) => c.isPrimary);
    return primary?.client.externalId ?? accessibleClients[0]?.client.externalId ?? null;
  }, [appState.activeClientId, accessibleClients]);

  // Get the full active client record
  const activeClient = useMemo(
    () => accessibleClients.find((c) => c.client.externalId === activeClientId) ?? null,
    [accessibleClients, activeClientId]
  );

  // When accessible clients load and no active client is set, set the default
  useEffect(() => {
    if (!isLoading && accessibleClients.length > 0 && !appState.activeClientId) {
      const primary = accessibleClients.find((c) => c.isPrimary);
      const defaultClientId = primary?.client.externalId ?? accessibleClients[0]?.client.externalId;
      if (defaultClientId) {
        setAppState({ activeClientId: defaultClientId });
      }
    }
  }, [isLoading, accessibleClients, appState.activeClientId, setAppState]);

  // Switch to a different client
  const setActiveClient = useCallback(
    async (clientExternalId: string) => {
      // Verify user has access to this client
      const hasAccess = accessibleClients.some((c) => c.client.externalId === clientExternalId);
      if (!hasAccess) {
        throw new Error("You do not have access to this client");
      }

      // Update app state
      await setAppState({ activeClientId: clientExternalId });

      // Invalidate all queries to refetch with new client context
      queryClient.invalidateQueries();

      // Revalidate React Router loaders
      revalidate();
    },
    [accessibleClients, setAppState, queryClient, revalidate]
  );

  const refetchClients = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const hasMultipleClients = accessibleClients.length > 1;

  const value: ClientAccessContextValue = {
    accessibleClients,
    activeClientId,
    activeClient,
    setActiveClient,
    isLoading,
    hasMultipleClients,
    refetchClients,
  };

  return <ClientAccessContext.Provider value={value}>{children}</ClientAccessContext.Provider>;
}

export function useClientAccess() {
  const context = useContext(ClientAccessContext);
  if (!context) {
    throw new Error("useClientAccess must be used within a ClientAccessProvider");
  }
  return context;
}

/**
 * Hook to get the active client ID for API calls.
 * Returns null if user only has one client (no header needed).
 * Returns the external ID if user has multiple clients and is switched.
 */
export function useActiveClientHeader(): string | null {
  const context = useContext(ClientAccessContext);

  // If not in a ClientAccessProvider, return null (no header)
  if (!context) {
    return null;
  }

  // Only return client ID if user has multiple clients
  // and is not on their primary client
  if (!context.hasMultipleClients) {
    return null;
  }

  const primary = context.accessibleClients.find((c) => c.isPrimary);
  if (primary && context.activeClientId === primary.client.externalId) {
    return null; // On primary client, no header needed
  }

  return context.activeClientId;
}
