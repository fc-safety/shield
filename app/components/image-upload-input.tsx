import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, Loader2, Upload } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { cn } from "~/lib/utils";

export interface ImageUploadInputProps {
  onImageChange?: (file: File | null) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  accept?: string;
  name?: string;
  id?: string;
  required?: boolean;
  onBlur?: () => void;
}

const ImageUploadInput = forwardRef<HTMLInputElement, ImageUploadInputProps>(
  (
    {
      onImageChange,
      onError,
      className,
      disabled = false,
      accept = "image/*",
      ...props
    },
    ref
  ) => {
    const inputId = useId();
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (file: File | null) => {
      if (file) {
        setError(null);
      }
      onImageChange?.(file);
    };

    const handleUrlSubmit = async () => {
      let cleanedUrl = url.trim();
      if (!cleanedUrl.match(/^[a-z]:\/\//)) {
        cleanedUrl = `https://${cleanedUrl}`;
      }

      if (!cleanedUrl) {
        setError("Please enter a URL");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(cleanedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.startsWith("image/")) {
          throw new Error("URL does not point to a valid image");
        }

        const blob = await response.blob();
        const file = new File([blob], "image-from-url", {
          type: contentType,
        });

        handleFileChange(file);
        setUrl("");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load image from URL";
        setError(errorMessage);
        onError?.(errorMessage);
        handleFileChange(null);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUrlSubmit();
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Enter image URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyUp={handleKeyPress}
              disabled={disabled || isLoading}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleUrlSubmit}
              disabled={disabled || isLoading || !url.trim()}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Download />}
            </Button>
          </div>
          <div className="relative">
            <Input
              ref={ref}
              id={inputId}
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange(file);
              }}
              disabled={disabled || isLoading}
              className="hidden"
              {...props}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() =>
                document.getElementById(props.id || inputId)?.click()
              }
              disabled={disabled || isLoading}
              title="Upload from device"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

ImageUploadInput.displayName = "ImageUploadInput";

export { ImageUploadInput };
