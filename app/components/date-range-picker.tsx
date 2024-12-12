import { format, isAfter, isBefore, toDate } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  className?: string;
  displayFormat?: string;
  min?: Date;
  max?: Date;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const DateRangePicker = ({
  className,
  value,
  onChange = () => {},
  onBlur,
  disabled,
  min,
  max,
  displayFormat = "LLL dd, y",
  ...props
}: DateRangePickerProps & React.HTMLAttributes<HTMLButtonElement>) => {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            disabled={disabled}
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
            {...props}
          >
            <CalendarIcon />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, displayFormat)} -{" "}
                  {format(value.to, displayFormat)}
                </>
              ) : (
                format(value.from, displayFormat)
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" onBlur={onBlur}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from ? toDate(value.from) : undefined}
            selected={value}
            onSelect={onChange}
            disabled={(date) =>
              (min !== undefined && isBefore(date, min)) ||
              (max !== undefined && isAfter(date, max))
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
