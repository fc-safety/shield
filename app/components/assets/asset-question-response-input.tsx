import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ASSET_QUESTION_TONES } from "~/lib/constants";
import type { AssetQuestionResponseType } from "~/lib/models";
import type { ResponseValueImage } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import { cn, formatDateAsTimestamp, formatTimestampAsDate } from "~/lib/utils";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import PreviewInspectionImages from "./preview-inspection-images";

type TValue<T extends AssetQuestionResponseType> = T extends "NUMBER"
  ? number
  : T extends "IMAGE"
    ? ResponseValueImage
    : string;

interface AssetQuestionResponseTypeInputProps<T extends AssetQuestionResponseType> {
  valueType: T;
  value: TValue<T>;
  onValueChange: (value: TValue<T>) => void;
  onBlur: () => void;
  disabled?: boolean;
  tone?: string;
  options?: { value: string; label?: string }[];
  placeholder?: string | null;
}

export default function AssetQuestionResponseTypeInput<T extends AssetQuestionResponseType>({
  valueType,
  value,
  onValueChange,
  onBlur,
  disabled = false,
  tone = ASSET_QUESTION_TONES.NEUTRAL,
  options,
  placeholder,
}: AssetQuestionResponseTypeInputProps<T>) {
  return valueType === "BINARY" || valueType === "INDETERMINATE_BINARY" ? (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(v) => onValueChange(v as TValue<T>)}
      disabled={disabled}
      className="w-full"
      variant="outline"
    >
      {["Yes", "No", ...(valueType === "INDETERMINATE_BINARY" ? ["N/A"] : [])].map((operand) => {
        const isPositiveTone = tone === ASSET_QUESTION_TONES.POSITIVE;
        const isNegativeTone = tone === ASSET_QUESTION_TONES.NEGATIVE;

        const showPositive =
          (isPositiveTone && operand === "Yes") || (isNegativeTone && operand === "No");
        const showNegative =
          (isNegativeTone && operand === "Yes") || (isPositiveTone && operand === "No");

        const isSelected = String(value) === operand;
        const hasNoTone = !isPositiveTone && !isNegativeTone;

        return (
          <ToggleGroupItem
            key={operand}
            value={operand}
            className={cn({
              "data-[state=off]:text-primary": showPositive,
              "data-[state=off]:text-destructive": showNegative,
              "data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground":
                showNegative,
              "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground":
                showPositive || hasNoTone,
            })}
          >
            {(showPositive || (isSelected && hasNoTone)) && <Check />}
            {showNegative && <X />}
            {operand}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  ) : valueType === "DATE" ? (
    <Input
      type="date"
      value={formatTimestampAsDate(String(value))}
      onChange={(e) => {
        onValueChange(formatDateAsTimestamp(e.target.value) as TValue<T>);
      }}
      onBlur={onBlur}
      disabled={disabled}
    />
  ) : valueType === "IMAGE" ? (
    <ImageUploadInput
      value={value as ResponseValueImage}
      onBlur={onBlur}
      onValueChange={(v) => onValueChange(v as TValue<T>)}
      disabled={disabled}
    />
  ) : valueType === "SELECT" ? (
    <Select
      value={value as string}
      onValueChange={(v) => onValueChange(v as TValue<T>)}
      disabled={disabled}
    >
      <SelectTrigger onBlur={onBlur}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label || option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Input
      value={value as string | number}
      type={valueType === "NUMBER" ? "number" : "text"}
      onBlur={onBlur}
      onChange={(e) => {
        const v = e.target.value;
        onValueChange((String(+v) !== v ? v : +v) as TValue<T>);
      }}
      disabled={disabled}
      placeholder={placeholder ?? undefined}
    />
  );
}

function ImageUploadInput({
  value: valueProp,
  onValueChange,
  disabled,
  onBlur,
}: {
  value?: ResponseValueImage;
  onValueChange?: (value: ResponseValueImage) => void;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const [value, setValueInternal] = useState<ResponseValueImage>(valueProp || { urls: [] });

  useEffect(() => {
    if (valueProp) setValueInternal(valueProp);
  }, [valueProp]);

  const setValue = (value: ResponseValueImage) => {
    setValueInternal(value);
    onValueChange?.(value);
  };

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
    mutationFn: handleVaultUpload,
    onSuccess: (url) => {
      setValue({ ...value, urls: [...value.urls, url] });
    },
  });

  const handleRemoveImage = (idx: number) => {
    setValue({ ...value, urls: value.urls.filter((_, i) => i !== idx) });
  };

  return (
    <div className="grid gap-2">
      <PreviewInspectionImages urls={value?.urls ?? []} onRemove={handleRemoveImage} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={disabled || isUploadingImage}
        asChild
      >
        <Label htmlFor="image-file-upload" className="flex w-full">
          <Input
            id="image-file-upload"
            accept="image/*"
            type="file"
            onBlur={onBlur}
            onChange={(e) => uploadImage(e.target.files?.[0])}
            disabled={disabled || isUploadingImage}
            className="hidden"
          />
          {isUploadingImage ? <Loader2 className="animate-spin" /> : <Plus />}
          Add Image
        </Label>
      </Button>
    </div>
  );
}

const handleVaultUpload = async (file: File | undefined | null) => {
  if (!file) {
    return;
  }

  const ext = file.type.split("/").pop();

  const key = `inspection_${format(new Date(), "yyyy-MM-dd")}${ext ? `.${ext}` : ""}`;
  const getUrlResponse = await fetch(buildPath("/api/image-upload-url", { key }));
  if (getUrlResponse.ok) {
    const { getUrl, putUrl } = await getUrlResponse.json();
    const uploadResponse = await fetch(putUrl, {
      method: "PUT",
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image", {
        cause: uploadResponse,
      });
    }
    return getUrl;
  }

  throw new Error("Failed to get image upload URL", {
    cause: getUrlResponse,
  });
};
