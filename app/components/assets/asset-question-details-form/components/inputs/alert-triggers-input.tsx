import { BadgeCheck, BellRing, Eraser, Pencil, Plus } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type z from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { cn, isNil } from "~/lib/utils";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";
import { alertTriggerVariants } from "../../utils/styles";
import {
  AlertTriggerConfigurator,
  ruleOperatorLabels,
} from "../sidepanel-inserts/alert-trigger-configurator";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "assetAlertCriteria">;

export default function AlertTriggersInput() {
  const { setData, openSidepanel } = useAssetQuestionDetailFormContext();

  const { watch, setValue, control, getFieldState } = useFormContext<TForm>();

  const createAlertTriggers = watch("assetAlertCriteria.createMany.data");
  const updateAlertTriggers = watch("assetAlertCriteria.updateMany");
  const deleteAlertTriggers = watch("assetAlertCriteria.deleteMany");

  const alertTriggers = useMemo(
    () => [
      ...(updateAlertTriggers?.map((t) => t.data) ?? []).map((t, idx) => ({
        idx,
        key: `update-${t.id}`,
        action: "update" as const,
        data: t,
      })),
      ...(createAlertTriggers ?? []).map((t, idx) => ({
        idx,
        key: `create-${idx}`,
        action: "create" as const,
        data: t,
      })),
    ],
    [createAlertTriggers, updateAlertTriggers]
  );

  const handleAddAlertTrigger = () => {
    setValue(
      "assetAlertCriteria.createMany.data",
      [
        ...(createAlertTriggers ?? []),
        {
          alertLevel: "INFO",
          rule: {},
          autoResolve: false,
        },
      ],
      { shouldDirty: true, shouldValidate: true }
    );
    setData((d) => {
      d.idx = (createAlertTriggers ?? []).length;
      d.action = "create";
    });
    openSidepanel(AlertTriggerConfigurator.Id);
  };

  const handleCancelAddAlertTrigger = (idx: number) => {
    setValue(
      "assetAlertCriteria.createMany.data",
      (createAlertTriggers ?? []).filter((_, i) => i !== idx),
      { shouldDirty: true }
    );
  };

  const handleDeleteAlertTrigger = (id: string) => {
    setValue(
      "assetAlertCriteria.updateMany",
      (updateAlertTriggers ?? []).filter(({ data }) => data.id !== id)
    );
    setValue("assetAlertCriteria.deleteMany", [...(deleteAlertTriggers ?? []), { id }], {
      shouldDirty: true,
    });
  };

  return (
    <FormField
      control={control}
      name="assetAlertCriteria"
      render={() => {
        return (
          <FormItem className="gap-0">
            <FormLabel className="inline-flex items-center gap-2 text-base font-medium">
              <BellRing className="size-4" />
              Alert Triggers
              <Button size="sm" variant="outline" type="button" onClick={handleAddAlertTrigger}>
                <Plus /> Add Trigger
              </Button>
            </FormLabel>
            <FormControl>
              <div className="divide-y-border divide-y">
                {alertTriggers.map(({ idx, key, action, data }) => (
                  <AlertTrigger
                    key={key}
                    idx={idx}
                    action={action}
                    className="py-1"
                    onRemove={
                      action === "create"
                        ? () => handleCancelAddAlertTrigger(idx)
                        : () =>
                            handleDeleteAlertTrigger(
                              (data as z.infer<typeof updateAssetQuestionSchema>).id
                            )
                    }
                  />
                ))}
              </div>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

function AlertTrigger({
  className,
  idx,
  onRemove,
  action,
}: {
  className?: string;
  idx: number;
  onRemove: () => void;
  action: "create" | "update";
}) {
  const { setData, openSidepanel } = useAssetQuestionDetailFormContext();
  const form = useFormContext<TForm>();
  const alertTriggerData = form.watch(
    action === "create"
      ? `assetAlertCriteria.createMany.data.${idx}`
      : `assetAlertCriteria.updateMany.${idx}.data`
  );

  if (!alertTriggerData) return null;

  const [operator, operand] = useMemo(() => {
    if (isNil(alertTriggerData.rule?.value)) return ["equals", "unknown"];
    if (typeof alertTriggerData.rule.value === "string")
      return ["equals", alertTriggerData.rule.value || `""`];
    const ops = Object.entries(alertTriggerData.rule.value).at(0);
    if (!ops) return ["equals", "unknown"];
    return [ops[0], ops[1] || '""'];
  }, [alertTriggerData.rule?.value]);

  const setConfiguratorData = (idx: number) => {
    setData((d) => {
      d.idx = idx;
      d.action = action;
    });
  };

  return (
    <div className={cn("flex flex-row items-center gap-2", className)}>
      <Button size="iconSm" variant="outline" type="button" onClick={() => onRemove()}>
        <Eraser className="text-destructive" />
      </Button>
      <Button
        size="iconSm"
        variant="outline"
        type="button"
        onClick={() => {
          setConfiguratorData(idx);
          openSidepanel(AlertTriggerConfigurator.Id);
        }}
      >
        <Pencil />
      </Button>
      <div className="flex items-center gap-1.5 text-sm">
        <Badge className={cn(alertTriggerVariants({ alertLevel: alertTriggerData.alertLevel }))}>
          {alertTriggerData.alertLevel}
        </Badge>
        <div>
          alert triggered when answer{" "}
          <span className="font-semibold">
            {ruleOperatorLabels[operator as keyof typeof ruleOperatorLabels]}
          </span>
        </div>
        <div>
          <Badge variant="outline">{operand}</Badge>.
        </div>
        {alertTriggerData.autoResolve && (
          <Badge variant="default">
            <BadgeCheck className="mr-1 size-4" />
            Auto-resolves
          </Badge>
        )}
      </div>
    </div>
  );
}
