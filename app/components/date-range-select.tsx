import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  isSameDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  onValueChange?: (value: DateRange) => void;
  title?: string;
}

export default function DateRangeSelect({
  value: valueProp,
  onValueChange,
  title = "Select Date Range",
}: DateRangeSelectProps) {
  const [internalValue, setInternalValue] = useState<DateRange>(
    QUICK_DATE_RANGES[0].value
  );
  const [_externalValue, _setExternalValue] = useState<DateRange>(
    valueProp ?? internalValue
  );

  const externalValue = useMemo(
    () => valueProp ?? _externalValue,
    [valueProp, _externalValue]
  );

  useEffect(() => {
    if (valueProp) {
      _setExternalValue(valueProp);
    }
  }, [valueProp]);

  const handleApplyChange = useCallback(() => {
    _setExternalValue(internalValue);
    onValueChange?.(internalValue);
  }, [onValueChange, internalValue]);

  const activeQuickRangeIndex = useMemo(() => {
    return externalValue
      ? QUICK_DATE_RANGES.findIndex((quickDateRange) =>
          isQuickRangeActive(externalValue, quickDateRange)
        )
      : -1;
  }, [externalValue]);

  return (
    <ResponsiveDialog
      title={title}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <span className="border-r border-border pr-2 font-semibold">
            Date Range
          </span>
          {(activeQuickRangeIndex > -1 &&
            QUICK_DATE_RANGES.at(activeQuickRangeIndex)?.label) || (
            <>
              {formatTimestampAsDate(externalValue.from)}
              <span className="mx-1">&#8596;</span>
              {formatTimestampAsDate(externalValue.to ?? "")}
            </>
          )}
        </Button>
      }
      className="w-full max-w-md"
      render={({ isDesktop }) => (
        <div className="flex flex-col gap-4 mt-2">
          <GradientScrollArea className="w-full">
            <div className="flex gap-2">
              {/* TODO: Upon reopeneing, put the active quick range first. */}
              {QUICK_DATE_RANGES.map((quickDateRange) => {
                const isActive = isQuickRangeActive(
                  internalValue,
                  quickDateRange
                );

                return (
                  <Button
                    key={quickDateRange.label}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => {
                      setInternalValue(quickDateRange.value);
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
                value={formatTimestampAsDate(internalValue.from)}
                onChange={(e) =>
                  setInternalValue({
                    ...internalValue,
                    from: formatDateAsTimestamp(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-range-to">To</Label>
              <Input
                id="date-range-to"
                type="date"
                value={formatTimestampAsDate(internalValue.to ?? "")}
                onChange={(e) =>
                  setInternalValue({
                    ...internalValue,
                    to: formatDateAsTimestamp(e.target.value),
                  })
                }
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
  label: string;
  value: {
    from: string;
    to: string;
  };
}

export const QUICK_DATE_RANGES: QuickDateRange[] = [
  {
    label: "Last 7 days",
    value: {
      from: subDays(new Date(), 7).toISOString(),
      to: new Date().toISOString(),
    },
  },
  {
    label: "This Week",
    value: {
      from: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
    },
  },
  {
    label: "Last 30 days",
    value: {
      from: subDays(new Date(), 30).toISOString(),
      to: new Date().toISOString(),
    },
  },
  {
    label: "This Month",
    value: {
      from: startOfMonth(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
    },
  },
  {
    label: "Last Month",
    value: {
      from: subMonths(new Date(), 1).toISOString(),
      to: endOfMonth(subMonths(new Date(), 1)).toISOString(),
    },
  },
  {
    label: "Last 3 months",
    value: {
      from: subMonths(new Date(), 3).toISOString(),
      to: new Date().toISOString(),
    },
  },
  {
    label: "Last 6 months",
    value: {
      from: subMonths(new Date(), 6).toISOString(),
      to: new Date().toISOString(),
    },
  },
  {
    label: "Last 12 months",
    value: {
      from: subMonths(new Date(), 12).toISOString(),
      to: new Date().toISOString(),
    },
  },
  {
    label: "This Year",
    value: {
      from: startOfYear(new Date()).toISOString(),
      to: endOfYear(new Date()).toISOString(),
    },
  },
];

const isQuickRangeActive = (value: DateRange, quickRange: QuickDateRange) => {
  return (
    isSameDay(value.from, quickRange.value.from) &&
    isSameDay(value.to ?? new Date(), quickRange.value.to)
  );
};
