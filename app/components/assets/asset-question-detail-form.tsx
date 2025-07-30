import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { OctagonAlert, Plus, Trash } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useForm, useFormContext } from "react-hook-form";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { ASSET_QUESTION_TONE_OPTIONS, ASSET_QUESTION_TONES } from "~/lib/constants";
import {
  AlertLevels,
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  ConsumableMappingTypes,
  type AssetQuestion,
  type AssetQuestionResponseType,
  type ConsumableMappingType,
} from "~/lib/models";
import {
  createAssetAlertCriterionSchema,
  createAssetQuestionSchema,
  ruleOperatorsSchema,
  updateAssetQuestionSchema,
  type CreateAssetAlertCriterionRule,
} from "~/lib/schema";
import type { ResponseValueImage } from "~/lib/types";
import { cn, humanize } from "~/lib/utils";
import HelpPopover from "../help-popover";
import LegacyIdField from "../legacy-id-field";
import { Checkbox } from "../ui/checkbox";
import AssetQuestionResponseTypeInput from "./asset-question-response-input";
import ConsumableCombobox from "./consumable-combobox";

type TForm = z.infer<typeof updateAssetQuestionSchema | typeof createAssetQuestionSchema>;

export interface AssetQuestionDetailFormProps {
  assetQuestion?: AssetQuestion;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  active: true,
  type: "INSPECTION",
  required: true,
  prompt: "",
  valueType: "BINARY",
} satisfies TForm;

export default function AssetQuestionDetailForm({
  assetQuestion,
  onSubmitted,
}: AssetQuestionDetailFormProps) {
  const isNew = !assetQuestion;

  const form = useForm<TForm>({
    resolver: zodResolver(
      (assetQuestion ? updateAssetQuestionSchema : createAssetQuestionSchema) as z.Schema<TForm>
    ),
    values: assetQuestion
      ? {
          ...assetQuestion,
          order: assetQuestion.order ?? undefined,
          assetAlertCriteria: {
            updateMany: assetQuestion.assetAlertCriteria?.map((c) => ({
              where: { id: c.id },
              data: { ...c },
            })),
          },
          consumableConfig: assetQuestion.consumableConfig
            ? {
                update: {
                  consumableProduct: assetQuestion.consumableConfig.consumableProductId
                    ? {
                        connect: {
                          id: assetQuestion.consumableConfig.consumableProductId,
                        },
                      }
                    : undefined,
                  mappingType: assetQuestion.consumableConfig.mappingType,
                },
              }
            : undefined,
          tone: assetQuestion?.tone ?? ASSET_QUESTION_TONES.NEUTRAL,
        }
      : {
          ...FORM_DEFAULTS,
        },
    mode: "onChange",
  });

  const {
    formState: { isDirty, isValid },
    watch,
    getFieldState,
  } = form;

  const type = watch("type");
  const consumableConfig = watch("consumableConfig");

  const requiredValueType = useMemo(() => {
    if (consumableConfig) {
      const theConfig =
        (
          consumableConfig as Exclude<
            z.infer<typeof updateAssetQuestionSchema>["consumableConfig"],
            undefined
          >
        ).update ?? consumableConfig.create;

      if (theConfig?.mappingType) {
        return consumableConfigMappingTypeToResponseType[theConfig.mappingType];
      }
    }
  }, [consumableConfig]);

  useEffect(() => {
    if (requiredValueType) {
      form.setValue("valueType", requiredValueType);
    }
  }, [requiredValueType, form]);

  const atomicCounter = useRef(0);

  const createAlertTriggers = watch("assetAlertCriteria.createMany.data");
  const updateAlertTriggers = watch("assetAlertCriteria.updateMany");
  const deleteAlertTriggers = watch("assetAlertCriteria.deleteMany");
  const valueType = watch("valueType");
  const tone = watch("tone");

  // Automatically set the tone based on question type if the question is new.
  useEffect(() => {
    if (
      !isNew ||
      !valueType ||
      !TONE_SUPPORTED_VALUE_TYPES.includes(valueType) ||
      getFieldState("tone").isTouched
    ) {
      return;
    }

    if (type === "SETUP" && tone !== ASSET_QUESTION_TONES.NEUTRAL) {
      form.setValue("tone", ASSET_QUESTION_TONES.NEUTRAL, {
        shouldDirty: true,
      });
    } else if (type === "INSPECTION" && tone !== ASSET_QUESTION_TONES.POSITIVE) {
      form.setValue("tone", ASSET_QUESTION_TONES.POSITIVE, {
        shouldDirty: true,
      });
    }
  }, [valueType, form, tone, type, getFieldState]);

  const alertTriggers: {
    idx: number;
    key: string;
    action: "create" | "update";
    data:
      | z.infer<typeof createAssetAlertCriterionSchema>
      | Partial<z.infer<typeof createAssetAlertCriterionSchema>>;
  }[] = useMemo(
    () => [
      ...(updateAlertTriggers?.map((t) => t.data) ?? []).map((t, idx) => ({
        idx,
        key: `update.${atomicCounter.current++}`,
        action: "update" as const,
        data: t,
      })),
      ...(createAlertTriggers ?? []).map((t, idx) => ({
        idx,
        key: `create.${atomicCounter.current++}`,
        action: "create" as const,
        data: t,
      })),
    ],
    [createAlertTriggers, updateAlertTriggers]
  );

  const handleAddAlertTrigger = () => {
    form.setValue(
      "assetAlertCriteria.createMany.data",
      [
        ...(createAlertTriggers ?? []),
        {
          alertLevel: "INFO",
          rule: {},
          autoResolve: false,
        },
      ],
      { shouldDirty: true }
    );
  };

  const handleCancelAddAlertTrigger = (idx: number) => {
    form.setValue(
      "assetAlertCriteria.createMany.data",
      (createAlertTriggers ?? []).filter((_, i) => i !== idx),
      { shouldDirty: true }
    );
  };

  const handleDeleteAlertTrigger = (id: string) => {
    form.setValue(
      "assetAlertCriteria.updateMany",
      (updateAlertTriggers ?? []).filter(({ data }) => data.id !== id)
    );
    form.setValue("assetAlertCriteria.deleteMany", [...(deleteAlertTriggers ?? []), { id }], {
      shouldDirty: true,
    });
  };

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/asset-questions`,
      id: assetQuestion?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="active"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <div className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={value}
                    onCheckedChange={onChange}
                    className="pt-0"
                    onBlur={onBlur}
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <LegacyIdField
          form={form}
          fieldName="legacyQuestionId"
          label="Legacy Question ID"
          description="Question ID from the legacy Shield system"
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <RadioGroup {...field} onValueChange={onChange} className="flex gap-4">
                  {AssetQuestionTypes.map((type, idx) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={"questionStatus" + idx} />
                      <Label htmlFor={"questionStatus" + idx}>{humanize(type)}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="required"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Required</FormLabel>
              <FormControl>
                <Switch
                  checked={value}
                  onCheckedChange={onChange}
                  className="flex"
                  onBlur={onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="valueType"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Answer Type</FormLabel>
              <FormControl>
                <Select value={value} onValueChange={onChange} disabled={!!requiredValueType}>
                  <SelectTrigger onBlur={onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {AssetQuestionResponseTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {humanize(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {valueType && TONE_SUPPORTED_VALUE_TYPES.includes(valueType) && (
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Tone
                  <HelpPopover classNames={{ content: "space-y-2" }}>
                    <p>The tone is used to provide visual aids to inspectors.</p>
                    <p>
                      For example, a "Positive" tone will display a green checkmark when the answer
                      is "Yes". "Negative" will display a red X when the answer is "Yes".
                    </p>
                  </HelpPopover>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_QUESTION_TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {type === "SETUP" && (
          <div>
            <h3 className="mb-4 inline-flex items-center gap-2 text-lg font-medium">
              Configure Supply
              {consumableConfig && (
                <Button
                  size="icon"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    form.setValue("consumableConfig", undefined);
                  }}
                >
                  <Trash />
                </Button>
              )}
            </h3>
            <div className="space-y-4">
              {consumableConfig ? (
                <>
                  <FormField
                    control={form.control}
                    name={
                      consumableConfig.create
                        ? "consumableConfig.create.consumableProduct.connect.id"
                        : "consumableConfig.update.consumableProduct.connect.id"
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supply</FormLabel>
                        <FormControl>
                          <ConsumableCombobox
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            className="flex w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={
                      consumableConfig.create
                        ? "consumableConfig.create.mappingType"
                        : "consumableConfig.update.mappingType"
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mapping Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger onBlur={field.onBlur}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ConsumableMappingTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {humanize(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => {
                    form.setValue("consumableConfig", {
                      create: {
                        consumableProduct: {
                          connect: {
                            id: "",
                          },
                        },
                        mappingType: "EXPIRATION_DATE",
                      },
                    });
                  }}
                >
                  Add Consumable
                </Button>
              )}
            </div>
          </div>
        )}

        {(type === "INSPECTION" || type === "SETUP_AND_INSPECTION") && (
          <div>
            {/* TODO: Add help sidebar. */}
            <h3 className="mb-4 text-lg font-medium">Alert Triggers</h3>
            <div className="divide-y-border divide-y">
              {alertTriggers.map(({ idx, key, action, data }) => (
                <AlertTrigger
                  key={key}
                  idx={idx}
                  action={action}
                  className="py-4"
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
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="mt-4 w-full"
              onClick={handleAddAlertTrigger}
            >
              <Plus /> Add Alert Trigger
            </Button>
          </div>
        )}
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}

function AlertTrigger({
  className,
  idx,
  action,
  onRemove,
}: {
  className?: string;
  idx: number;
  action: "create" | "update";
  onRemove: () => void;
}) {
  const form = useFormContext<TForm>();
  const { control } = form;
  const tone = form.watch("tone");

  return (
    <div className={cn("flex flex-row items-center gap-4", className)}>
      <Button size="icon" variant="destructive" type="button" onClick={() => onRemove()}>
        <Trash />
      </Button>
      <div className="grid grow gap-2">
        <FormField
          control={control}
          name={
            action === "create"
              ? `assetAlertCriteria.createMany.data.${idx}.alertLevel`
              : `assetAlertCriteria.updateMany.${idx}.data.alertLevel`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Trigger</FormLabel>
                <FormControl>
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger
                      onBlur={onBlur}
                      className={cn(
                        value === "CRITICAL" &&
                          "bg-critical text-critical-foreground border-critical",
                        value === "URGENT" && "bg-urgent text-urgent-foreground border-urgent",
                        value === "WARNING" &&
                          "bg-warning text-warning-foreground border-warning-foreground",
                        value === "INFO" && "bg-info text-info-foreground border-info-foreground",
                        value === "AUDIT" &&
                          "bg-audit text-audit-foreground border-audit-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1 [&_svg]:size-4 [&_svg]:shrink-0">
                        {value === "CRITICAL" && <OctagonAlert />}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent side="top">
                      {AlertLevels.map((level) => (
                        <SelectItem
                          key={level}
                          value={level}
                          // className={cn(
                          //   "font-bold",
                          //   level === "CRITICAL" && "focus:text-purple-700",
                          //   level === "URGENT" && "focus:text-red-700",
                          //   level === "WARNING" && "focus:text-yellow-700",
                          //   level === "INFO" && "focus:text-blue-700",
                          //   level === "AUDIT" && "focus:text-secondary"
                          // )}
                        >
                          {humanize(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormLabel className="w-max shrink-0">level alert when:</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={
            action === "create"
              ? `assetAlertCriteria.createMany.data.${idx}.rule`
              : `assetAlertCriteria.updateMany.${idx}.data.rule`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormControl>
                <AlertTriggerInput
                  onValueChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  tone={tone}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={
            action === "create"
              ? `assetAlertCriteria.createMany.data.${idx}.autoResolve`
              : `assetAlertCriteria.updateMany.${idx}.data.autoResolve`
          }
          render={({ field: { onChange, value } }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={value} onCheckedChange={onChange} />
                </FormControl>
                <FormLabel className="flex items-center gap-1">
                  Resolve automatically?
                  <HelpPopover>
                    <p>
                      If enabled, the alert will be automatically resolved when it is triggered.
                    </p>
                  </HelpPopover>
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

interface AlertTriggerInputProps {
  onValueChange: (value: CreateAssetAlertCriterionRule) => void;
  onBlur: () => void;
  value?: CreateAssetAlertCriterionRule;
  tone?: string;
}

function AlertTriggerInput({ onValueChange, onBlur, value, tone }: AlertTriggerInputProps) {
  const form = useFormContext<TForm>();
  const { watch } = form;

  const valueType = watch("valueType");

  const allowedOperators = useMemo(
    () => allowedOperatorsForValueType[valueType ?? "TEXT"],
    [valueType]
  );

  const [rawOperator, rawOperand] = useMemo((): [RuleOperator, string | number | true] => {
    if (value?.value !== undefined) {
      if (typeof value.value === "string") {
        return ["equals", value.value];
      }

      const result = Object.entries(value.value).find(([, v]) => v !== undefined);
      if (result) {
        return result as [RuleOperator, string | number | true];
      }
    }

    return ["equals", ""];
  }, [value]);

  const [operator, operand] = useMemo<[RuleOperator, string | number | true]>(() => {
    if (allowedOperators.includes(rawOperator)) {
      return [rawOperator, rawOperand];
    }

    if (allowedOperators.includes("notEmpty")) {
      return ["notEmpty", true as const];
    }

    return ["equals", ""];
  }, [rawOperator, rawOperand, allowedOperators]);

  const handleChangeOperator = (newOperator: string) => {
    onValueChange({
      value: {
        [newOperator]: cleanOperand(newOperator, operand),
      },
    });
  };

  const handleChangeOperand = (newOperand: string | number) => {
    onValueChange({
      value: {
        [operator]: cleanOperand(operator, newOperand),
      },
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Input
          value="answer"
          onChange={(e) => e.preventDefault()}
          readOnly
          className="bg-muted focus-visible:ring-0"
        />
        <Select value={operator} onValueChange={handleChangeOperator}>
          <SelectTrigger onBlur={onBlur}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {allowedOperators.map((operator) => (
              <SelectItem key={operator} value={operator}>
                {ruleOperatorLabels[operator]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {(typeof operand === "string" || typeof operand === "number") && (
        <AssetQuestionResponseTypeInput
          valueType={
            determineValueTypeFromOperator(operator, valueType ?? "BINARY") as Exclude<
              AssetQuestionResponseType,
              "IMAGE"
            >
          }
          onValueChange={handleChangeOperand}
          onBlur={onBlur}
          value={operand}
          tone={tone}
        />
      )}
    </div>
  );
}

type RuleOperator = keyof typeof ruleOperatorsSchema.shape;

const ruleOperatorLabels: Record<RuleOperator, string> = {
  empty: "is empty",
  notEmpty: "is not empty",
  equals: "is",
  not: "is not",
  contains: "contains",
  notContains: "does not contain",
  startsWith: "starts with",
  endsWith: "ends with",
  gt: "is greater than",
  gte: "is greater than or equal to",
  lt: "is less than",
  lte: "is less than or equal to",
  beforeDaysPast: "is before # days in the past",
  afterDaysPast: "is after # days in the past",
  beforeDaysFuture: "is before # days in the future",
  afterDaysFuture: "is after # days in the future",
};

const allowedOperatorsForValueType: Record<AssetQuestionResponseType, RuleOperator[]> = {
  BINARY: ["equals", "not"],
  INDETERMINATE_BINARY: ["equals", "not"],
  TEXT: ["empty", "notEmpty", "equals", "not", "contains", "notContains", "startsWith", "endsWith"],
  TEXTAREA: [
    "empty",
    "notEmpty",
    "equals",
    "not",
    "contains",
    "notContains",
    "startsWith",
    "endsWith",
  ],
  DATE: [
    "empty",
    "notEmpty",
    "equals",
    "not",
    "gt",
    "gte",
    "lt",
    "lte",
    "beforeDaysPast",
    "afterDaysPast",
    "beforeDaysFuture",
    "afterDaysFuture",
  ],
  NUMBER: ["empty", "notEmpty", "equals", "not", "gt", "gte", "lt", "lte"],
  IMAGE: ["empty", "notEmpty"],
};

const cleanOperand = (opr: string, opd: string | number | true | ResponseValueImage) => {
  if (["empty", "notEmpty"].includes(opr)) {
    return true as const;
  }

  if (["gt", "gte", "lt", "lte"].includes(opr)) {
    return Number.isNaN(+opd) ? String(opd) : +opd;
  }

  return opd === true ? "" : String(opd);
};

const determineValueTypeFromOperator = (
  operator: RuleOperator,
  valueType: AssetQuestionResponseType
) => {
  if (
    ["beforeDaysPast", "afterDaysPast", "beforeDaysFuture", "afterDaysFuture"].includes(operator)
  ) {
    return "NUMBER";
  }

  return valueType;
};

const consumableConfigMappingTypeToResponseType: Record<
  ConsumableMappingType,
  AssetQuestionResponseType
> = {
  EXPIRATION_DATE: "DATE",
};

const TONE_SUPPORTED_VALUE_TYPES: AssetQuestionResponseType[] = ["BINARY", "INDETERMINATE_BINARY"];
