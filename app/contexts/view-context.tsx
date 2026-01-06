import { createContext, useContext, type ReactNode } from "react";

export type ViewContext = "admin" | "user";

const ViewContextContext = createContext<ViewContext>("user");

export function ViewContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ViewContext;
}) {
  return <ViewContextContext.Provider value={value}>{children}</ViewContextContext.Provider>;
}

export function useViewContext(): ViewContext {
  return useContext(ViewContextContext);
}
