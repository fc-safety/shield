import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { useCallback, useMemo, useRef } from "react";
import { useCustomInput } from "~/hooks/use-custom-input";
import { formatDateAsTimestamp, formatTimestampAsDate } from "~/lib/utils";
import GradientScrollArea from "./gradient-scroll-area";
import { ResponsiveDialog } from "./responsive-dialog";
import { Button } from "./ui/button";
import { DialogClose } from "./ui/dialog";
import { DrawerClose } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollBar } from "./ui/scroll-area";

interface DateRange {
  from: string;
  to?: string;
}

interface DateRangeSelectProps {
  value?: DateRange;
  onValueChange?: (
    value: DateRange | undefined,
    quickRangeId: QuickRangeId | undefined
  ) => void;
  quickRangeId?: QuickRangeId;
  defaultQuickRangeId?: QuickRangeId;
  onSelectQuickRangeId?: (quickRangeId: QuickRangeId | undefined) => void;
  title?: string;
}

export default function DateRangeSelect({
  value: valueProp,
  onValueChange,
  quickRangeId: quickRangeIdProp,
  defaultQuickRangeId: defaultQuickRangeIdProp,
  onSelectQuickRangeId,
  title = "Select Date Range",
}: DateRangeSelectProps) {
  const defaultQuickRangeId = useRef(defaultQuickRangeIdProp);
  const initialValue = useMemo(() => {
    // Prefer quick range if provided.
    const quickRangeId = quickRangeIdProp ?? defaultQuickRangeId.current;
    if (quickRangeId) {
      const quickRangeValue = getQuickRangeValueById(quickRangeId);
      if (quickRangeValue) {
        return quickRangeValue;
      }
    }

    // Otherwise, prefer value if provided.
    if (valueProp) {
      return valueProp;
    }

    // Otherwise, use the first quick range.
    return getQuickRangeValue(QUICK_DATE_RANGES[0]);
  }, [valueProp, quickRangeIdProp]);

  const { value, setValue, appliedValue, applyValue } =
    useCustomInput<DateRange>({
      value: initialValue,
      onValueChange: (value) => {
        // Send the current quick range ID with the value. This allows the parent
        // to reapply the same quick range ID on page reload.
        onValueChange?.(value, quickRangeId);
      },
    });

  const {
    value: quickRangeId,
    setValue: setQuickRangeId,
    appliedValue: appliedQuickRangeId,
    applyValue: applyQuickRangeId,
  } = useCustomInput<QuickRangeId>({
    defaultValue: defaultQuickRangeIdProp,
    value: quickRangeIdProp,
    onValueChange: onSelectQuickRangeId,
    onPendingValueChange: (qrId) => {
      if (!qrId) {
        return;
      }

      const quickRange = QUICK_DATE_RANGES.find((qr) => qr.id === qrId);
      if (quickRange) {
        setValue(getQuickRangeValue(quickRange));
      }
    },
  });

  const handleApplyChange = useCallback(() => {
    applyQuickRangeId();
    applyValue();
  }, [applyValue, applyQuickRangeId]);

  return (
    <ResponsiveDialog
      title={title}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <span className="border-r border-border pr-2 font-semibold">
            Date Range
          </span>
          {QUICK_DATE_RANGES.find((qr) => qr.id === appliedQuickRangeId)
            ?.label ||
            (appliedValue ? (
              <>
                {formatTimestampAsDate(appliedValue.from)}
                <span className="mx-1">&#8596;</span>
                {formatTimestampAsDate(appliedValue.to ?? "")}
              </>
            ) : (
              QUICK_DATE_RANGES[0].label
            ))}
        </Button>
      }
      className="w-full max-w-md"
      render={({ isDesktop }) => (
        <div className="flex flex-col gap-4 mt-2">
          <GradientScrollArea className="w-full">
            <div className="flex gap-2">
              {QUICK_DATE_RANGES.map((quickDateRange) => {
                const isActive = quickRangeId === quickDateRange.id;

                return (
                  <Button
                    key={quickDateRange.label}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => {
                      setQuickRangeId(quickDateRange.id);
                    }}
                    size="sm"
                    type="button"
                  >
                    {quickDateRange.label}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </GradientScrollArea>
          <div className="w-full grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-range-from">From</Label>
              <Input
                id="date-range-from"
                type="date"
                value={value && formatTimestampAsDate(value.from)}
                onChange={(e) => {
                  setQuickRangeId(undefined);
                  setValue({
                    ...value,
                    from: formatDateAsTimestamp(e.target.value, false),
                  });
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-range-to">To</Label>
              <Input
                id="date-range-to"
                type="date"
                value={value && formatTimestampAsDate(value.to ?? "")}
                onChange={(e) => {
                  setQuickRangeId(undefined);
                  setValue({
                    // Provide default in case value is somehow empty.
                    from: new Date().toISOString(),
                    ...value,
                    to: formatDateAsTimestamp(e.target.value, true),
                  });
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {(() => {
              const CloseWrapper = isDesktop ? DialogClose : DrawerClose;
              return (
                <>
                  <CloseWrapper asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </CloseWrapper>
                  <CloseWrapper asChild>
                    <Button type="button" onClick={handleApplyChange}>
                      Apply
                    </Button>
                  </CloseWrapper>
                </>
              );
            })()}
          </div>
        </div>
      )}
    />
  );
}

interface QuickDateRange {
  id: string;
  label: string;
  value: {
    from: () => string;
    to: () => string;
  };
}

export const QUICK_DATE_RANGES = [
  {
    id: "last-7-days",
    label: "Last 7 days",
    value: {
      from: () => subDays(new Date(), 7).toISOString(),
      to: () => endOfDay(new Date()).toISOString(),
    },
  },
  {
    id: "this-week",
    label: "This Week",
    value: {
      from: () => startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      to: () => endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
    },
  },
  {
    id: "last-30-days",
    label: "Last 30 days",
    value: {
      from: () => subDays(new Date(), 30).toISOString(),
      to: () => endOfDay(new Date()).toISOString(),
    },
  },
  {
    id: "this-month",
    label: "This Month",
    value: {
      from: () => startOfMonth(new Date()).toISOString(),
      to: () => endOfMonth(new Date()).toISOString(),
    },
  },
  {
    id: "last-month",
    label: "Last Month",
    value: {
      from: () => startOfMonth(subMonths(new Date(), 1)).toISOString(),
      to: () => endOfMonth(subMonths(new Date(), 1)).toISOString(),
    },
  },
  {
    id: "last-90-days",
    label: "Last 90 days",
    value: {
      from: () => subDays(new Date(), 90).toISOString(),
      to: () => endOfDay(new Date()).toISOString(),
    },
  },
  {
    id: "last-3-months",
    label: "Last 3 months",
    value: {
      from: () => subMonths(new Date(), 3).toISOString(),
      to: () => endOfDay(new Date()).toISOString(),
    },
  },
  {
    id: "last-6-months",
    label: "Last 6 months",
    value: {
      from: () => subMonths(new Date(), 6).toISOString(),
      to: () => endOfDay(new Date()).toISOString(),
    },
  },
  {
    id: "last-12-months",
    label: "Last 12 months",
    value: {
      from: () => subMonths(new Date(), 12).toISOString(),
      to: () => endOfDay(new Date()).toISOString(),
    },
  },
  {
    id: "this-year",
    label: "This Year",
    value: {
      from: () => startOfYear(new Date()).toISOString(),
      to: () => endOfYear(new Date()).toISOString(),
    },
  },
] as const satisfies QuickDateRange[];

export type QuickRangeId = (typeof QUICK_DATE_RANGES)[number]["id"];

const getQuickRangeValue = (quickRange: QuickDateRange) => {
  return {
    from: quickRange.value.from(),
    to: quickRange.value.to(),
  };
};

const getQuickRangeValueById = (quickRangeId: string) => {
  const quickRange = QUICK_DATE_RANGES.find((qr) => qr.id === quickRangeId);
  if (!quickRange) {
    return undefined;
  }

  return getQuickRangeValue(quickRange);
};
