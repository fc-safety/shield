import type { QuickRangeId } from "~/components/date-range-select";
import type { DateRangeSupport } from "~/lib/types";

export type QuickRangeIdFromDateRangeSupport<T extends DateRangeSupport> =
  QuickRangeId<
    T extends "FUTURE"
      ? "future"
      : T extends "PAST"
      ? "past"
      : T extends "BOTH"
      ? "both"
      : never
  >;
