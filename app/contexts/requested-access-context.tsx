import { createContext, useContext, useState, type ReactNode } from "react";
import { useActiveAccessGrant } from "./active-access-grant-context";

export type ViewContext = "admin" | "user";
export interface RequestedAccessContextValue {
  viewContext: ViewContext;
  currentClientId: string | null;
  currentSiteId: string | null;
  setCurrentClientId: (clientId: string | null) => void;
  setCurrentSiteId: (siteId: string | null) => void;
}

const RequestedAccessContextContext = createContext<RequestedAccessContextValue>({
  viewContext: "user",
  currentClientId: null,
  currentSiteId: null,
  setCurrentClientId: () => {},
  setCurrentSiteId: () => {},
});

export function RequestedAccessContextProvider({
  children,
  viewContext,
  clientId,
  siteId,
}: {
  children: ReactNode;
  viewContext: ViewContext;
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
        viewContext,
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

export function useViewContext(): ViewContext {
  const { viewContext } = useRequestedAccessContext();

  return viewContext;
}
