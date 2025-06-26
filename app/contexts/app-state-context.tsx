import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { useRevalidator } from "react-router";
import type { AppState } from "~/lib/types";

type SetAppStateOptions = {
  revalidate?: boolean;
};

const AppStateContext = createContext<{
  appState: AppState;
  setAppState: (
    appState: Partial<AppState> | ((appState: AppState) => Partial<AppState>),
    options?: SetAppStateOptions
  ) => Promise<void>;
} | null>(null);

export const AppStateProvider = ({
  children,
  appState,
}: PropsWithChildren<{ appState: AppState }>) => {
  const [localAppState, setLocalAppState] = useState(appState);
  const { revalidate } = useRevalidator();

  const setAppState = useCallback(
    async (
      appStateSetter:
        | Partial<AppState>
        | ((appState: AppState) => Partial<AppState>),
      options: SetAppStateOptions = {}
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

      if (options.revalidate) {
        revalidate();
      }
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

export function useAppStateValue<K extends keyof AppState>(
  key: K,
  defaultValue: NonNullable<AppState[K]>
): [
  NonNullable<AppState[K]>,
  (
    value:
      | NonNullable<AppState[K]>
      | ((prev: NonNullable<AppState[K]>) => AppState[K]),
    options?: SetAppStateOptions
  ) => void
];
export function useAppStateValue<K extends keyof AppState>(
  key: K
): [
  AppState[K],
  (
    value: AppState[K] | ((prev: AppState[K]) => AppState[K]),
    options?: SetAppStateOptions
  ) => void
];
export function useAppStateValue<K extends keyof AppState>(
  key: K,
  defaultValue?: AppState[K]
): [
  AppState[K],
  (
    value: AppState[K] | ((prev: AppState[K]) => AppState[K]),
    options?: SetAppStateOptions
  ) => void
] {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within a AppStateProvider");
  }

  const setAppState = useCallback(
    (
      appStateSetter: AppState[K] | ((appState: AppState[K]) => AppState[K]),
      options?: SetAppStateOptions
    ) => {
      const setter =
        typeof appStateSetter === "function"
          ? (prev: Partial<AppState>) => ({
              ...prev,
              [key]: appStateSetter(prev[key] ?? (defaultValue as AppState[K])),
            })
          : { [key]: appStateSetter };
      context.setAppState(setter, options);
    },
    [context, key]
  );

  return [context.appState[key] ?? defaultValue, setAppState] as const;
}
