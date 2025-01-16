import { format, isAfter, isBefore } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useRef, useState } from "react";

interface DatePickerProps {
  className?: string;
  displayFormat?: string;
  min?: Date;
  max?: Date;
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const DatePicker = forwardRef<
  HTMLButtonElement,
  DatePickerProps & React.HTMLAttributes<HTMLButtonElement>
>(
  (
    {
      className,
      value,
      onValueChange = () => {},
      onBlur,
      disabled,
      min,
      max,
      displayFormat = "PPP",
      ...props
    },
    ref
  ) => {
    const opened = useRef(false);
    const [open, setOpen] = useState(false);

    // Trigger onBlur when the popover is closed.
    useEffect(() => {
      if (opened.current && !open) {
        onBlur?.();
      }

      if (open) {
        opened.current = true;
      }
    }, [open, onBlur]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "min-w-[240px] justify-start text-left font-normal flex w-full",
              !value && "text-muted-foreground",
              className
            )}
            {...props}
            ref={ref}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, displayFormat) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onValueChange}
            disabled={(date) =>
              (min !== undefined && isBefore(date, min)) ||
              (max !== undefined && isAfter(date, max))
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DatePicker.displayName = "DatePicker";
