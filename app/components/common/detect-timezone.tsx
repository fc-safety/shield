import { useEffect, useState } from "react";
import { useAppState } from "~/contexts/app-state-context";

export default function DetectTimezone() {
  const { appState, setAppState } = useAppState();
  const [timeZone, setTimeZone] = useState<string | null>(null);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(timezone);
  }, []);

  useEffect(() => {
    if (timeZone !== null && timeZone !== appState.timeZone) {
      setAppState({ timeZone });
    }
  }, [timeZone, appState.timeZone]);

  return null;
}
