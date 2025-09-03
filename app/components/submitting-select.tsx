import { useState } from "react";
import type { ViewContext } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SubmittingSelectProps {
  value: string;
  onValueChange?: (value: string) => void;
  path: string;
  valueKey: string | ((value: string) => any);
  options: Array<{ value: string; label: string }>;
  className?: string;
  placeholder?: string;
  viewContext?: ViewContext;
}

export default function SubmittingSelect({
  value,
  onValueChange,
  path,
  valueKey,
  options,
  className,
  placeholder = "Select...",
  viewContext,
}: SubmittingSelectProps) {
  const [currentValue, setCurrentValue] = useState(() => value);
  const { submitJson: updateValue, isLoading } = useModalFetcher();

  return (
    <Select
      value={currentValue}
      onValueChange={(newValue) => {
        setCurrentValue(newValue);
        onValueChange?.(newValue);
        updateValue(
          typeof valueKey === "function" ? valueKey(newValue) : { [valueKey]: newValue },
          {
            method: "patch",
            path,
            viewContext,
          }
        );
      }}
      disabled={isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
