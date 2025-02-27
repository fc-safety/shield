import { DatePicker } from "@/components/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { AssetQuestionResponseType } from "~/lib/models";
import type { ResponseValueImage } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import PreviewInspectionImages from "./preview-inspection-images";

type TValue<T extends AssetQuestionResponseType> = T extends "NUMBER"
  ? number
  : T extends "IMAGE"
  ? ResponseValueImage
  : string;

interface AssetQuestionResponseTypeInputProps<
  T extends AssetQuestionResponseType
> {
  valueType: T;
  value: TValue<T>;
  onValueChange: (value: TValue<T>) => void;
  onBlur: () => void;
  disabled?: boolean;
}

export default function AssetQuestionResponseTypeInput<
  T extends AssetQuestionResponseType
>({
  valueType,
  value,
  onValueChange,
  onBlur,
  disabled = false,
}: AssetQuestionResponseTypeInputProps<T>) {
  return valueType === "BINARY" || valueType === "INDETERMINATE_BINARY" ? (
    <Select
      value={String(value)}
      onValueChange={(v) => onValueChange(v as TValue<T>)}
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
          onValueChange(date.toISOString() as TValue<T>);
        } else {
          onValueChange("" as TValue<T>);
        }
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
  const [value, setValueInternal] = useState<ResponseValueImage>(
    valueProp || { urls: [] }
  );

  useEffect(() => {
    console.log("valueProp", valueProp);
    if (valueProp) setValueInternal(valueProp);
  }, [valueProp]);

  const setValue = (value: ResponseValueImage) => {
    setValueInternal(value);
    onValueChange?.(value);
  };

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
    mutationFn: handleVaultUpload,
    onSuccess: (url) => {
      console.debug("uploadImage success", url, "existing value", value);
      setValue({ ...value, urls: [...value.urls, url] });
    },
  });

  const handleRemoveImage = (idx: number) => {
    setValue({ ...value, urls: value.urls.filter((_, i) => i !== idx) });
  };

  return (
    <div className="grid gap-2">
      <PreviewInspectionImages
        urls={value?.urls ?? []}
        onRemove={handleRemoveImage}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={disabled || isUploadingImage}
        asChild
      >
        <Label htmlFor="image-file-upload" className="w-full flex">
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

  const key = `inspection_${format(new Date(), "yyyy-MM-dd")}${
    ext ? `.${ext}` : ""
  }`;
  const getUrlResponse = await fetch(
    buildPath("/api/image-upload-url", { key })
  );
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
