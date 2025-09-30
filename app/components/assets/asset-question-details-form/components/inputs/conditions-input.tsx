import { Columns3Cog, Eraser, Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type z from "zod";
import ConditionPill from "~/components/assets/condition-pill";
import HelpPopover from "~/components/help-popover";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { useConditionLabels } from "~/hooks/use-condition-labels";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";
import { ConditionConfigurator } from "../sidepanel-inserts/condition-configurator";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "conditions">;

export default function ConditionsInput() {
  const { setData, openSidepanel } = useAssetQuestionDetailFormContext();
  const { prefetchLabels, isLoading, getLabel } = useConditionLabels();

  const { watch, setValue, control } = useFormContext<TForm>();

  const createConditions = watch("conditions.createMany.data");
  const updateConditions = watch("conditions.updateMany");
  const deleteConditions = watch("conditions.deleteMany");

  const conditions = useMemo(
    () => [
      ...(updateConditions?.map((c) => c.data) ?? []).map((c, idx) => ({
        idx,
        key: `update-${c.id}`,
        action: "update" as const,
        data: c,
      })),
      ...(createConditions ?? []).map((c, idx) => ({
        idx,
        key: `create-${idx}`,
        action: "create" as const,
        data: c,
      })),
    ],
    [createConditions, updateConditions]
  );

  useEffect(() => {
    const conditionsData = conditions.map(({ data }) => data);
    if (conditionsData.length > 0) {
      prefetchLabels(conditionsData);
    }
  }, [JSON.stringify(conditions.map(({ data }) => data)), prefetchLabels]);

  const setConfiguratorData = (idx: number, action: "create" | "update") => {
    setData((d) => {
      d.idx = idx;
      d.action = action;
    });
  };

  const handleAddCondition = () => {
    setValue(
      "conditions.createMany.data",
      [
        ...(createConditions ?? []),
        {
          conditionType: "PRODUCT_CATEGORY",
          value: [],
          description: "",
        },
      ],
      { shouldDirty: true }
    );
    setConfiguratorData((createConditions ?? []).length, "create");
    openSidepanel(ConditionConfigurator.Id);
  };

  const handleCancelAddCondition = (idx: number) => {
    setValue(
      "conditions.createMany.data",
      (createConditions ?? []).filter((_, i) => i !== idx),
      { shouldDirty: true }
    );
  };

  const handleDeleteCondition = (id: string) => {
    setValue(
      "conditions.updateMany",
      (updateConditions ?? []).filter(({ data }) => data.id !== id),
      { shouldDirty: true }
    );
    setValue("conditions.deleteMany", [...(deleteConditions ?? []), { id }], {
      shouldDirty: true,
    });
  };

  return (
    <FormField
      control={control}
      name="conditions"
      render={() => {
        return (
          <FormItem className="gap-0">
            <FormLabel className="inline-flex items-center gap-2 text-base font-medium">
              <Columns3Cog className="size-4" />
              Conditions
              <HelpPopover>
                <p>
                  These conditions are used to determine if or when this question will be presented
                  to the inspector.
                </p>
              </HelpPopover>
              <Button size="sm" variant="outline" type="button" onClick={handleAddCondition}>
                <Plus /> Add Condition
              </Button>
            </FormLabel>
            <FormControl>
              <div className="divide-y-border divide-y">
                {conditions.flatMap(({ idx, key, action, data: condition }) => (
                  <div className="flex flex-row items-center gap-2 py-1" key={`${key}-${idx}`}>
                    <Button
                      size="iconSm"
                      variant="outline"
                      type="button"
                      onClick={
                        action === "create"
                          ? () => handleCancelAddCondition(idx)
                          : () =>
                              handleDeleteCondition(
                                (condition as z.infer<typeof updateAssetQuestionSchema>).id
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
                        openSidepanel(ConditionConfigurator.Id);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <ConditionPill
                      condition={condition}
                      label={
                        <div>
                          {condition.value.map((v, idx) => {
                            const label = getLabel(condition.conditionType, v, "–");
                            const isValueLoading = isLoading(condition.conditionType, v);

                            return (
                              <span key={v}>
                                {isValueLoading ? (
                                  <Loader2 className="inline size-3 animate-spin" />
                                ) : (
                                  label
                                )}
                                {condition.value.length > 1 &&
                                  idx < condition.value.length - 1 &&
                                  ", "}
                              </span>
                            );
                          })}
                        </div>
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setConfiguratorData(idx, action);
                        openSidepanel(ConditionConfigurator.Id);
                      }}
                    />
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

// function Condition({
//   className,
//   idx,
//   onRemove,
// }: {
//   className?: string;
//   idx: number;
//   onRemove: () => void;
// }) {
//   const { setArrayIdx, action, openSidepanel } = useAssetQuestionDetailFormContext();
//   const form = useFormContext<TForm>();
//   const alertTriggerData = form.watch(
//     action === "create"
//       ? `conditions.createMany.data.${idx}`
//       : `conditions.updateMany.${idx}.data`
//   );

//   if (!alertTriggerData) return null;

//   return (
//     <div className={cn("flex flex-row items-center gap-2", className)}>
//       <Button size="iconSm" variant="outline" type="button" onClick={() => onRemove()}>
//         <Eraser className="text-destructive" />
//       </Button>
//       <Button
//         size="iconSm"
//         variant="outline"
//         type="button"
//         onClick={() => {
//           setArrayIdx(idx);
//           openSidepanel(ConditionConfigurator.Id);
//         }}
//       >
//         <Pencil />
//       </Button>
//       <div className="flex items-center gap-1.5 text-sm">
//         <Badge className={cn(getAlertTriggerStyle(alertTriggerData.alertLevel))}>
//           {alertTriggerData.alertLevel}
//         </Badge>
//         <div>
//           alert triggered when answer{" "}
//           <span className="font-semibold">
//             {ruleOperatorLabels[operator as keyof typeof ruleOperatorLabels]}
//           </span>
//         </div>
//         <div>
//           <Badge variant="outline">{operand}</Badge>.
//         </div>
//         {alertTriggerData.autoResolve && (
//           <Badge variant="default">
//             <BadgeCheck className="mr-1 size-4" />
//             Auto-resolves
//           </Badge>
//         )}
//       </div>
//     </div>
//   );
// }
