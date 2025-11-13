import { enAU, enCA, enGB, enUS } from "date-fns/locale";
import { useAppState } from "~/contexts/app-state-context";

export function useHydrationSafeLocale() {
  const {
    appState: { locale },
  } = useAppState();
  return locale ? detectLocale(locale) : undefined;
}

const detectLocale = (localeStr: string) => {
  switch (localeStr) {
    case "en-US":
      return enUS;
    case "en-GB":
      return enGB;
    case "en-CA":
      return enCA;
    case "en-AU":
      return enAU;
  }
};
