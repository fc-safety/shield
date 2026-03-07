import { createContext, useCallback, useContext, useState } from "react";
import { useImmer, type Updater } from "use-immer";
import type { ViewContext } from "~/.server/api-utils";

export interface FormBanner {
  id: string;
  variant: "warning" | "destructive" | "default";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface TAssetQuestionDetailFormContext {
  sidepanelId: string | null;
  openSidepanel: (sidepanelId: string) => void;
  closeSidepanel: () => void;
  action: "create" | "update";
  data: Record<string, unknown>;
  setData: Updater<Record<string, unknown>>;
  clientId?: string | null;
  viewContext?: ViewContext;
  banners: FormBanner[];
  setBanner: (banner: FormBanner) => void;
  removeBanner: (id: string) => void;
}

export const AssetQuestionDetailFormContext = createContext<TAssetQuestionDetailFormContext>({
  sidepanelId: null,
  openSidepanel: () => {},
  closeSidepanel: () => {},
  action: "create",
  data: {},
  setData: () => {},
  clientId: undefined,
  banners: [],
  setBanner: () => {},
  removeBanner: () => {},
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
  const [banners, setBanners] = useState<FormBanner[]>([]);

  const setBanner = useCallback((banner: FormBanner) => {
    setBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === banner.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = banner;
        return next;
      }
      return [...prev, banner];
    });
  }, []);

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

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
        banners,
        setBanner,
        removeBanner,
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
