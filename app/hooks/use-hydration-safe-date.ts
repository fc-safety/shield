import { TZDate } from "@date-fns/tz";
import type { DateArg } from "date-fns";
import { useAppState } from "~/contexts/app-state-context";

export function useHydrationSafeDate(date: DateArg<Date>) {
  const {
    appState: { timeZone },
  } = useAppState();

  if (timeZone) {
    return new TZDate(new Date(date), timeZone);
  }

  return null;
}
