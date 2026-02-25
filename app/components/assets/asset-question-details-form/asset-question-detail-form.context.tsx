import { createContext, useContext, useState } from "react";
import { useImmer, type Updater } from "use-immer";
import type { ViewContext } from "~/.server/api-utils";

interface TAssetQuestionDetailFormContext {
  sidepanelId: string | null;
  openSidepanel: (sidepanelId: string) => void;
  closeSidepanel: () => void;
  action: "create" | "update";
  data: Record<string, unknown>;
  setData: Updater<Record<string, unknown>>;
  clientId?: string | null;
  viewContext?: ViewContext;
}

export const AssetQuestionDetailFormContext = createContext<TAssetQuestionDetailFormContext>({
  sidepanelId: null,
  openSidepanel: () => {},
  closeSidepanel: () => {},
  action: "create",
  data: {},
  setData: () => {},
  clientId: undefined,
});

export function AssetQuestionDetailFormProvider({
  action,
  children,
  clientId,
}: {
  action: "create" | "update";
  clientId?: string | null;
  children: React.ReactNode;
}) {
  const [sidepanelId, setSidepanelId] = useState<string | null>(null);
  const [data, setData] = useImmer<Record<string, unknown>>({});

  return (
    <AssetQuestionDetailFormContext.Provider
      value={{
        sidepanelId,
        openSidepanel: setSidepanelId,
        closeSidepanel: () => setSidepanelId(null),
        action,
        data,
        setData,
        clientId,
      }}
    >
      {children}
    </AssetQuestionDetailFormContext.Provider>
  );
}

export function useAssetQuestionDetailFormContext() {
  const context = useContext(AssetQuestionDetailFormContext);

  if (!context) {
    throw new Error(
      "useAssetQuestionDetailFormContext must be used within a AssetQuestionDetailFormProvider"
    );
  }

  return context;
}
