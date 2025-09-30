import { Eraser, ExternalLink, FolderCog, Pencil, Plus } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Link } from "react-router";
import type z from "zod";
import HelpPopover from "~/components/help-popover";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";
import FileConfigurator from "../sidepanel-inserts/file-configurator";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "files">;

export default function FilesInput() {
  const { setData, openSidepanel } = useAssetQuestionDetailFormContext();
  const { watch, setValue, control } = useFormContext<TForm>();

  const createFiles = watch("files.createMany.data");
  const updateFiles = watch("files.updateMany");
  const deleteFiles = watch("files.deleteMany");

  const files = useMemo(() => {
    return [
      ...(updateFiles?.map((t) => t.data) ?? []).map((f, idx) => ({
        idx,
        key: `update-${f.id}`,
        action: "update" as const,
        data: f,
      })),
      ...(createFiles ?? []).map((f, idx) => ({
        idx,
        key: `create-${idx}`,
        action: "create" as const,
        data: f,
      })),
    ];
  }, [createFiles, updateFiles]);

  const setConfiguratorData = (idx: number, action: "create" | "update") => {
    setData((d) => {
      d.idx = idx;
      d.action = action;
    });
  };

  const handleAddFile = () => {
    setValue("files.createMany.data", [...(createFiles ?? []), { name: "Untitled", url: "" }], {
      shouldDirty: true,
    });
    setConfiguratorData((createFiles ?? []).length, "create");
    openSidepanel(FileConfigurator.Id);
  };

  const handleCancelAddFile = (idx: number) => {
    setValue(
      "files.createMany.data",
      (createFiles ?? []).filter((_, i) => i !== idx),
      {
        shouldDirty: true,
      }
    );
  };

  const handleDeleteFile = (id: string) => {
    setValue(
      "files.updateMany",
      (updateFiles ?? []).filter(({ data }) => data.id !== id),
      {
        shouldDirty: true,
      }
    );
    setValue("files.deleteMany", [...(deleteFiles ?? []), { id }], {
      shouldDirty: true,
    });
  };

  return (
    <FormField
      control={control}
      name="files"
      render={() => {
        return (
          <FormItem className="gap-0">
            <FormLabel className="inline-flex items-center gap-2 text-base font-medium">
              <FolderCog className="size-4" />
              Files
              <HelpPopover>
                <p>Files can be added here and shown to inspectors, usually for reference.</p>
              </HelpPopover>
              <Button size="sm" variant="outline" type="button" onClick={handleAddFile}>
                <Plus /> Add File
              </Button>
            </FormLabel>
            <FormControl>
              <div className="divide-y-border divide-y">
                {files.map(({ idx, key, action, data }) => (
                  <div className="flex flex-row items-center gap-2 py-1" key={key}>
                    <Button
                      size="iconSm"
                      variant="outline"
                      type="button"
                      onClick={
                        action === "create"
                          ? () => handleCancelAddFile(idx)
                          : () =>
                              handleDeleteFile(
                                (data as z.infer<typeof updateAssetQuestionSchema>).id
                              )
                      }
                    >
                      <Eraser className="text-destructive" />
                    </Button>
                    <Button
                      size="iconSm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setConfiguratorData(idx, action);
                        openSidepanel(FileConfigurator.Id);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button variant="link" asChild disabled={!data.url}>
                      <Link to={data.url ?? "#"} target="_blank" rel="noopener noreferrer">
                        {data.name || "Untitled"}
                        <ExternalLink />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
