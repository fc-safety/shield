import { BetweenHorizonalEnd, Eraser, Plus } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type z from "zod";
import HelpPopover from "~/components/help-popover";
import MetadataKeyCombobox from "~/components/metadata-key-combobox";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { updateAssetQuestionSchema } from "~/lib/schema";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "setAssetMetadataConfig">;

export default function SetMetadataInput({ requireDynamic = false }: { requireDynamic?: boolean }) {
  const { watch, setValue, control } = useFormContext<TForm>();

  const createSetAssetMetadataConfigs = watch("setAssetMetadataConfig.create.metadata");
  const updateSetAssetMetadataConfigs = watch("setAssetMetadataConfig.update.metadata");

  const isUpdate = watch("setAssetMetadataConfig.update") !== undefined;

  const setMetadataConfigs = useMemo(() => {
    if (isUpdate) {
      return (updateSetAssetMetadataConfigs ?? []).map((metadata, idx) => ({
        idx,
        key: `update-${idx}`,
        action: "update" as const,
        data: metadata,
      }));
    }
    return (createSetAssetMetadataConfigs ?? []).map((metadata, idx) => ({
      idx,
      key: `create-${idx}`,
      action: "create" as const,
      data: metadata,
    }));
  }, [createSetAssetMetadataConfigs, updateSetAssetMetadataConfigs]);

  const handleAddMetadataConfig = () => {
    const DEFAULT_METADATA = {
      key: "",
      type: "DYNAMIC" as const,
      value: "",
    };

    const existingMetadata = isUpdate
      ? updateSetAssetMetadataConfigs
      : createSetAssetMetadataConfigs;

    setValue(
      `setAssetMetadataConfig.${isUpdate ? "update" : "create"}.metadata`,
      [...(existingMetadata ?? []), DEFAULT_METADATA],
      { shouldDirty: true }
    );
  };

  return (
    <FormField
      control={control}
      name="setAssetMetadataConfig"
      render={() => {
        return (
          <FormItem className="gap-0">
            <FormLabel className="mb-1 inline-flex items-center gap-2 text-base font-medium">
              <BetweenHorizonalEnd className="size-4" />
              Set Metadata
              <HelpPopover>
                <p>Configure asset metadata to be set when this question is answered.</p>
                <br />
                <p>
                  When <strong>static</strong> is enabled, you must provide a static metadata value
                  to be set. Otherwise, it will use the answer from the question as the metadata
                  value.
                </p>
              </HelpPopover>
              <Button size="sm" variant="outline" type="button" onClick={handleAddMetadataConfig}>
                <Plus /> Add Metadata
              </Button>
            </FormLabel>
            <FormControl>
              <div className="divide-y-border divide-y">
                {setMetadataConfigs.map(({ data, key, action }, idx) => (
                  <div key={key} className="flex flex-wrap items-center gap-2 py-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      type="button"
                      className="text-destructive"
                      onClick={() =>
                        setValue(
                          `setAssetMetadataConfig.${action}.metadata`,
                          (
                            (action === "create"
                              ? createSetAssetMetadataConfigs
                              : updateSetAssetMetadataConfigs) ?? []
                          ).filter((_, i) => i !== idx),
                          { shouldDirty: true }
                        )
                      }
                    >
                      <Eraser className="size-4" />
                    </Button>
                    <MetadataKeyCombobox
                      value={data.key}
                      onValueChange={(e) =>
                        setValue(`setAssetMetadataConfig.${action}.metadata.${idx}.key`, e ?? "", {
                          shouldDirty: true,
                        })
                      }
                      className="max-w-[300px] flex-1"
                      placeholder="Enter metadata key..."
                    />
                    <Label className="flex items-center gap-1">
                      <Checkbox
                        disabled={requireDynamic}
                        checked={data.type === "STATIC"}
                        onCheckedChange={(checked) =>
                          setValue(
                            `setAssetMetadataConfig.${action}.metadata.${idx}.type`,
                            checked ? "STATIC" : "DYNAMIC",
                            {
                              shouldDirty: true,
                            }
                          )
                        }
                      />
                      Static?
                    </Label>
                    {data.type === "STATIC" && (
                      <Input
                        value={data.value ?? ""}
                        onChange={(e) =>
                          setValue(
                            `setAssetMetadataConfig.${action}.metadata.${idx}.value`,
                            e.target.value,
                            {
                              shouldDirty: true,
                            }
                          )
                        }
                        className="max-w-[300px] flex-1"
                        placeholder="Enter static metadata value..."
                      />
                    )}
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
