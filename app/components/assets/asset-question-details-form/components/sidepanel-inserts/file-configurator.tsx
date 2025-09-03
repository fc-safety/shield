import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Loader2 } from "lucide-react";
import { useId } from "react";
import { useFormContext } from "react-hook-form";
import { Link } from "react-router";
import type z from "zod";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { buildPath } from "~/lib/urls";
import { slugify } from "~/lib/utils";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "files">;

export default function FileConfigurator() {
  const { data: contextData } = useAssetQuestionDetailFormContext();

  const idx = (contextData.idx ?? 0) as number;
  const fileAction = contextData.action as "create" | "update";

  const { watch, control } = useFormContext<TForm>();

  const fileDataInput = watch(
    fileAction === "create" ? `files.createMany.data.${idx}` : `files.updateMany.${idx}.data`
  );

  return fileDataInput ? (
    <div className="space-y-6" key={`${idx}-${fileAction}`}>
      <div>
        <h3 className="text-lg font-medium">Configure File</h3>
        <p className="text-muted-foreground text-sm">
          Files can be shown to inspectors for any given question during an inspection. These files
          are commonly PDF documents used to provide additional details.
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={control}
          name={
            fileAction === "create"
              ? `files.createMany.data.${idx}.name`
              : `files.updateMany.${idx}.data.name`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input value={value} onChange={onChange} onBlur={onBlur} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            fileAction === "create"
              ? `files.createMany.data.${idx}.url`
              : `files.updateMany.${idx}.data.url`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <FileInput value={value} onValueChange={onChange} onBlur={onBlur} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  ) : (
    <p className="text-muted-foreground w-full text-center text-sm">No data selected.</p>
  );
}

FileConfigurator.Id = "file-configurator";

const buildKey = (input: { file: File; ext: string | undefined }) => {
  const { file, ext } = input;
  return `asset-question-files/${format(new Date(), "yyyy-MM-dd")}_${slugify(file.name)}${ext ? `.${ext}` : ""}`;
};

function FileInput({
  value,
  onValueChange,
  onBlur,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
}) {
  const id = useId();
  const fileId = `file-input-${id}`;

  const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (file: File | undefined | null) => handleFileUpload(file, buildKey),
    onSuccess: onValueChange,
  });

  return (
    <div>
      <label htmlFor={fileId}>
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(fileId)?.click()}
          disabled={isUploadingImage}
        >
          {isUploadingImage && <Loader2 className="size-3 animate-spin" />}
          {value ? "Change File" : "Upload File"}
        </Button>
        <input
          type="file"
          className="hidden"
          id={fileId}
          hidden
          onChange={(e) => {
            uploadImage(e.target.files?.[0]);
          }}
          onBlur={onBlur}
          accept="application/pdf,image/*"
        />
      </label>
      {value && (
        <Button type="button" variant="link" asChild>
          <Link to={value} target="_blank" rel="noopener noreferrer">
            Preview
            <ExternalLink />
          </Link>
        </Button>
      )}
    </div>
  );
}

const handleFileUpload = async (
  file: File | undefined | null,
  buildKey: (input: { file: File; ext: string | undefined }) => string
) => {
  if (!file) {
    return;
  }

  const ext = file.type.split("/").pop();

  // Build key from product (and parent product if it exists).
  const key = buildKey({ file, ext });

  const getUrlResponse = await fetch(buildPath("/api/image-upload-url", { key, public: "" }));
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
