import { useMutation } from "@tanstack/react-query";
import { Image, Loader2, Plus, Trash, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useOpenData } from "~/hooks/use-open-data";
import { buildPath } from "~/lib/urls";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function RenderDefault({
  value,
  disabled,
  isUploadingImage,
  openPreview,
  clearValue,
  renderAddButtonText = "Add Image",
  renderAddButtonIcon: AddButtonIcon = Plus,
}: {
  value: string | undefined;
  disabled: boolean;
  isUploadingImage: boolean;
  openPreview?: () => void;
  clearValue?: () => void;
  renderAddButtonText?: string;
  renderAddButtonIcon?: LucideIcon;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="flex-1"
        disabled={disabled || isUploadingImage}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          (e.target as HTMLElement).parentElement?.click();
        }}
      >
        {isUploadingImage ? <Loader2 className="animate-spin" /> : <AddButtonIcon />}
        {renderAddButtonText}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Preview image"
        onClick={openPreview}
        disabled={!value || !openPreview}
        className="shrink-0"
      >
        <Image />
      </Button>
      {clearValue && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          title="Clear image"
          onClick={clearValue}
          disabled={!value}
          className="shrink-0"
        >
          <Trash />
        </Button>
      )}
    </div>
  );
}

export default function VaultUploadInput({
  value: valueProp,
  onValueChange,
  disabled,
  onBlur,
  buildKey,
  render = (props) => <RenderDefault {...props} />,
  renderAddButtonText,
  renderAddButtonIcon,
  accept,
  showClearButton = false,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  onBlur?: () => void;
  buildKey: Parameters<typeof handleVaultUpload>[1];
  renderAddButtonText?: string;
  renderAddButtonIcon?: LucideIcon;
  render?: (props: {
    disabled: boolean;
    value: string | undefined;
    isUploadingImage: boolean;
    openPreview?: () => void;
    clearValue?: () => void;
    renderAddButtonText?: string;
    renderAddButtonIcon?: LucideIcon;
  }) => React.ReactNode;
  accept?: string;
  showClearButton?: boolean;
}) {
  const inputId = useId();
  const originalValue = useRef(valueProp);
  const [value, setValueInternal] = useState<string | undefined>(valueProp);
  const previewImage = useOpenData<string>();
  const [previewImageLoading, setPreviewImageLoading] = useState(true);

  useEffect(() => {
    if (valueProp) setValueInternal(valueProp);
  }, [valueProp]);

  const setValue = (value: string) => {
    setValueInternal(value);
    onValueChange?.(value);
  };

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (file: File | undefined | null) => handleVaultUpload(file, buildKey),
    onSuccess: setValue,
  });

  const handleOpenImagePreview = (value: string) => {
    setPreviewImageLoading(true);
    previewImage.openData(value);
  };

  return (
    <div>
      <Input
        id={`vault-upload-input-${inputId}`}
        accept={accept}
        type="file"
        onBlur={onBlur}
        onChange={(e) => uploadImage(e.target.files?.[0])}
        disabled={disabled || isUploadingImage}
        className="hidden"
        hidden
      />
      <Label htmlFor={`vault-upload-input-${inputId}`} className="flex w-full">
        {render({
          disabled: !!disabled,
          value,
          isUploadingImage,
          openPreview: value ? () => handleOpenImagePreview(value) : undefined,
          clearValue: showClearButton && !originalValue.current ? () => setValue("") : undefined,
          renderAddButtonText,
          renderAddButtonIcon,
        })}
      </Label>
      <Dialog open={previewImage.open} onOpenChange={previewImage.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewImageLoading && (
            <div className="flex w-full items-center justify-center py-4">
              <Loader2 className="size-12 animate-spin" />
            </div>
          )}
          <img
            src={previewImage.data ?? ""}
            alt="Preview"
            onLoad={() => setPreviewImageLoading(false)}
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const handleVaultUpload = async (
  file: File | undefined | null,
  buildKey: (input: { file: File; ext: string | undefined }) => string
) => {
  if (!file) {
    return;
  }

  const ext = file.type.split("/").pop();

  const key = buildKey({ file, ext });
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
