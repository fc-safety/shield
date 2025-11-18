import { enAU, enCA, enGB, enUS } from "date-fns/locale";
import { useAppState } from "~/contexts/app-state-context";

/**
 * Returns the locale object if it is supported, otherwise undefined.
 *
 * @returns The locale object if it is supported, otherwise undefined.
 */
export function useHydrationSafeLocale() {
  const {
    appState: { locale },
  } = useAppState();
  return locale ? findLocale(locale) : undefined;
}

const findLocale = (localeStr: string) => {
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

  // Return undefined if no supported locale is found.
};
