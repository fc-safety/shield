import { createContext, useContext, useState, type ReactNode } from "react";
import type { AccessIntent } from "~/.server/api-utils";
import { useActiveAccessGrant } from "./active-access-grant-context";

export type ViewContext = "admin" | "user";
export interface RequestedAccessContextValue {
  /** @deprecated Use `accessIntent` property instead. */
  viewContext: ViewContext;
  accessIntent: AccessIntent;
  currentClientId: string | null;
  currentSiteId: string | null;
  setCurrentClientId: (clientId: string | null) => void;
  setCurrentSiteId: (siteId: string | null) => void;
}

const RequestedAccessContextContext = createContext<RequestedAccessContextValue>({
  viewContext: "user",
  accessIntent: "user",
  currentClientId: null,
  currentSiteId: null,
  setCurrentClientId: () => {},
  setCurrentSiteId: () => {},
});

export function RequestedAccessContextProvider({
  children,
  accessIntent,
  viewContext,
  clientId,
  siteId,
}: {
  children: ReactNode;
  accessIntent?: AccessIntent;
  viewContext?: ViewContext;
  clientId?: string | null;
  siteId?: string | null;
}) {
  const { activeClient } = useActiveAccessGrant();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const currentClientId = clientId ?? selectedClientId ?? activeClient?.clientId ?? null;
  const currentSiteId = siteId ?? selectedSiteId ?? activeClient?.siteId ?? null;

  return (
    <RequestedAccessContextContext.Provider
      value={{
        viewContext: viewContext ?? "user",
        accessIntent: accessIntent ?? "user",
        currentClientId,
        currentSiteId,
        setCurrentClientId: setSelectedClientId,
        setCurrentSiteId: setSelectedSiteId,
      }}
    >
      {children}
    </RequestedAccessContextContext.Provider>
  );
}

export const useRequestedAccessContext = () => {
  return useContext(RequestedAccessContextContext);
};

export function useAccessIntent(): AccessIntent {
  const { accessIntent } = useRequestedAccessContext();

  return accessIntent;
}
