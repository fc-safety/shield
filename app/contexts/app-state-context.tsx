import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import type { AppState } from "~/lib/types";

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
  const [localAppState, setLocalAppState] = useState(appState);

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

      setLocalAppState((prev) => ({
        ...prev,
        ...appStateToSet,
      }));

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
    <AppStateContext.Provider value={{ appState: localAppState, setAppState }}>
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

export const useAppStateValue = <
  K extends keyof AppState,
  T extends NonNullable<AppState[K]>,
  U extends T | undefined
>(
  key: K,
  defaultValue: U
) => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within a AppStateProvider");
  }

  const setAppState = useCallback(
    (appStateSetter: T | ((appState: T) => T)) => {
      const setter =
        typeof appStateSetter === "function"
          ? (prev: Partial<AppState>) => ({
              ...prev,
              [key]: appStateSetter(prev[key] as T),
            })
          : { [key]: appStateSetter };
      context.setAppState(setter);
    },
    [context]
  );

  return [context.appState[key] ?? defaultValue, setAppState] as const;
};
