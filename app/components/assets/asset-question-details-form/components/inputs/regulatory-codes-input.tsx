import { Eraser, Pencil, Plus, ScrollText } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type z from "zod";
import HelpPopover from "~/components/help-popover";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";
import RegulatoryCodeConfigurator from "../sidepanel-inserts/regulatory-code-configurator";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "regulatoryCodes">;

export default function RegulatoryCodesInput() {
  const { setData, openSidepanel } = useAssetQuestionDetailFormContext();
  const { watch, setValue, control } = useFormContext<TForm>();

  const createRegulatoryCodes = watch("regulatoryCodes.create");
  const updateRegulatoryCodes = watch("regulatoryCodes.update");
  const deleteRegulatoryCodes = watch("regulatoryCodes.delete");

  const regulatoryCodes = useMemo(() => {
    return [
      ...(updateRegulatoryCodes ?? [])
        .map((rc) => rc.data)
        .map((rc, idx) => ({
          idx,
          key: `update-${rc.id}`,
          action: "update" as const,
          data: rc,
        })),
      ...(createRegulatoryCodes ?? []).map((rc, idx) => ({
        idx,
        key: `create-${idx}`,
        action: "create" as const,
        data: rc,
      })),
    ];
  }, [createRegulatoryCodes, updateRegulatoryCodes]);

  const setConfiguratorData = (idx: number, action: "create" | "update") => {
    setData((d) => {
      d.idx = idx;
      d.action = action;
    });
  };

  const handleAddRegulatoryCode = () => {
    setValue(
      "regulatoryCodes.create",
      [
        ...(createRegulatoryCodes ?? []),
        {
          active: true,
          codeIdentifier: "",
          title: "",
          governingBody: "",
          section: "",
          sourceUrl: "",
          documentVersion: "",
        },
      ],
      {
        shouldDirty: true,
      }
    );
    setConfiguratorData((createRegulatoryCodes ?? []).length, "create");
    openSidepanel(RegulatoryCodeConfigurator.Id);
  };

  const handleCancelAddRegulatoryCode = (idx: number) => {
    setValue(
      "regulatoryCodes.create",
      (createRegulatoryCodes ?? []).filter((_, i) => i !== idx),
      {
        shouldDirty: true,
      }
    );
  };

  const handleDeleteRegulatoryCode = (id: string) => {
    setValue(
      "regulatoryCodes.update",
      (updateRegulatoryCodes ?? []).filter(({ data }) => data.id !== id),
      {
        shouldDirty: true,
      }
    );
    setValue("regulatoryCodes.delete", [...(deleteRegulatoryCodes ?? []), { id }], {
      shouldDirty: true,
    });
  };

  return (
    <FormField
      control={control}
      name="regulatoryCodes"
      render={() => {
        return (
          <FormItem className="gap-0">
            <FormLabel className="inline-flex items-center gap-2 text-base font-medium">
              <ScrollText className="size-4" />
              Regulatory Codes
              <HelpPopover>
                <p>
                  Regulatory codes can be added here to track compliance requirements and
                  regulations associated with this asset question.
                </p>
              </HelpPopover>
              <Button size="sm" variant="outline" type="button" onClick={handleAddRegulatoryCode}>
                <Plus /> Add Regulatory Code
              </Button>
            </FormLabel>
            <FormMessage />
            <FormControl>
              <div className="divide-y-border divide-y">
                {regulatoryCodes.map(({ idx, key, action, data }) => (
                  <div className="flex flex-row items-center gap-2 py-1" key={key}>
                    <Button
                      size="iconSm"
                      variant="outline"
                      type="button"
                      onClick={
                        action === "create"
                          ? () => handleCancelAddRegulatoryCode(idx)
                          : () =>
                              handleDeleteRegulatoryCode(
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
                        openSidepanel(RegulatoryCodeConfigurator.Id);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{data.codeIdentifier || "No Code"}</span>
                      {data.title && (
                        <span className="text-muted-foreground ml-2">- {data.title}</span>
                      )}
                      {data.section && (
                        <span className="text-muted-foreground ml-2">({data.section})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}
