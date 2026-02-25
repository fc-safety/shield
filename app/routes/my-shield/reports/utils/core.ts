import {
  QUICK_DATE_RANGES,
  type QuickRangeId,
} from "~/components/date-range-select";
import type { DateRangeSupport } from "~/lib/types";
import type { QuickRangeIdFromDateRangeSupport } from "../types";

export const getDefaultDateRange = (quickRangeId: QuickRangeId<"both">) => {
  const quickRange =
    QUICK_DATE_RANGES.find((range) => range.id === quickRangeId) ??
    QUICK_DATE_RANGES[0];
  return {
    from: quickRange.value.from(),
    to: quickRange.value.to(),
  };
};

export const getDefaultQuickRangeId = (
  dateRangeSupport: DateRangeSupport
): QuickRangeIdFromDateRangeSupport<DateRangeSupport> => {
  switch (dateRangeSupport) {
    case "FUTURE":
      return "next-30-days";
    default:
      return "last-90-days";
  }
};
