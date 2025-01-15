import { DatePicker } from "@/components/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValid, parseISO } from "date-fns";
import type { AssetQuestionResponseType } from "~/lib/models";

interface AssetQuestionResponseTypeInputProps {
  valueType: AssetQuestionResponseType;
  value: string | number;
  onValueChange: (value: string | number) => void;
  onBlur: () => void;
  disabled?: boolean;
}

export default function AssetQuestionResponseTypeInput({
  valueType,
  value,
  onValueChange,
  onBlur,
  disabled = false,
}: AssetQuestionResponseTypeInputProps) {
  return ["BINARY", "INDETERMINATE_BINARY"].includes(valueType) ? (
    <Select
      value={String(value)}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger onBlur={onBlur}>
        <SelectValue placeholder="Select a response" />
      </SelectTrigger>
      <SelectContent side="top">
        {[
          "Yes",
          "No",
          ...(valueType === "INDETERMINATE_BINARY" ? ["N/A"] : []),
        ].map((operand) => (
          <SelectItem key={operand} value={operand}>
            {operand}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : valueType === "DATE" ? (
    <DatePicker
      value={
        isValid(parseISO(String(value))) ? parseISO(String(value)) : undefined
      }
      onValueChange={(date) => {
        if (date) {
          onValueChange(date.toISOString());
        } else {
          onValueChange("");
        }
      }}
      onBlur={onBlur}
      disabled={disabled}
    />
  ) : (
    <Input
      value={value}
      type={valueType === "NUMBER" ? "number" : "text"}
      onBlur={onBlur}
      onChange={(e) => {
        const v = e.target.value;
        onValueChange(String(+v) !== v ? v : +v);
      }}
      disabled={disabled}
    />
  );
}
