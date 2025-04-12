import {
  createContext,
  useCallback,
  useContext,
  type PropsWithChildren,
} from "react";
import type { QueryParams } from "~/lib/urls";

interface AppState {
  sidebarState?: Record<string, boolean>;
  productRequestsQuery?: QueryParams & {
    createdOn: {
      gte: string;
      lte?: string;
    };
  };
}

const AppStateContext = createContext<{
  appState: AppState;
  setAppState: (
    appState: Partial<AppState> | ((appState: AppState) => Partial<AppState>)
  ) => Promise<void>;
} | null>(null);

export const AppStateProvider = ({
  children,
  appState,
}: PropsWithChildren<{ appState: AppState }>) => {
  const setAppState = useCallback(
    async (
      appStateSetter:
        | Partial<AppState>
        | ((appState: AppState) => Partial<AppState>)
    ) => {
      const appStateToSet =
        typeof appStateSetter === "function"
          ? appStateSetter(appState)
          : appStateSetter;
      await fetch("/action/set-app-state", {
        method: "POST",
        body: JSON.stringify(appStateToSet),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    [appState]
  );

  return (
    <AppStateContext.Provider value={{ appState, setAppState }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within a AppStateProvider");
  }
  return context;
};
