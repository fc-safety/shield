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

interface DatePickerProps {
  className?: string;
  displayFormat?: string;
  min?: Date;
  max?: Date;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const DatePicker = ({
  className,
  value,
  onChange = () => {},
  onBlur,
  disabled,
  min,
  max,
  displayFormat = "PPP",
  ...props
}: DatePickerProps & React.HTMLAttributes<HTMLButtonElement>) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "min-w-[280px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, displayFormat) : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" onBlur={onBlur}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={(date) =>
            (min !== undefined && isBefore(date, min)) ||
            (max !== undefined && isAfter(date, max))
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
