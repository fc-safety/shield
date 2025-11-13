import { useEffect, useState } from "react";
import { useAppState } from "~/contexts/app-state-context";

export default function DetectLocale() {
  const { appState, setAppState } = useAppState();
  const [locale, setLocale] = useState<string | null>(null);

  useEffect(() => {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    setLocale(locale);
  }, []);

  useEffect(() => {
    if (locale !== null && locale !== appState.locale) {
      setAppState({ locale });
    }
  }, [locale, appState.locale]);

  return null;
}
