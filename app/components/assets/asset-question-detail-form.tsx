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
import { Plus, Trash } from "lucide-react";
import { useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import type { z } from "zod";
import {
  AlertLevels,
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  type AssetQuestion,
  type AssetQuestionResponseType,
} from "~/lib/models";
import {
  createAssetAlertCriterionSchema,
  createAssetQuestionSchemaResolver,
  ruleOperatorsSchema,
  updateAssetQuestionSchemaResolver,
  type CreateAssetAlertCriterionRule,
  type createAssetQuestionSchema,
  type updateAssetQuestionSchema,
} from "~/lib/schema";
import { cn } from "~/lib/utils";
import AssetQuestionResponseTypeInput from "./asset-question-response-input";

type TForm = z.infer<
  typeof updateAssetQuestionSchema | typeof createAssetQuestionSchema
>;

export interface AssetQuestionDetailFormProps {
  assetQuestion?: AssetQuestion;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  active: true,
  type: "INSPECTION",
  required: false,
  prompt: "",
  valueType: "TEXT",
} satisfies TForm;

export default function AssetQuestionDetailForm({
  assetQuestion,
  onSubmitted,
}: AssetQuestionDetailFormProps) {
  const isNew = !assetQuestion;

  const form = useRemixForm<TForm>({
    resolver: assetQuestion
      ? updateAssetQuestionSchemaResolver
      : createAssetQuestionSchemaResolver,
    values: assetQuestion
      ? {
          ...assetQuestion,
          order: assetQuestion.order || undefined,
          assetAlertCriteria: {
            updateMany: assetQuestion.assetAlertCriteria?.map((c) => ({
              where: { id: c.id },
              data: { ...c },
            })),
          },
        }
      : FORM_DEFAULTS,
    mode: "onChange",
  });

  const {
    formState: { isDirty, isValid, isSubmitting },
    watch,
  } = form;

  const atomicCounter = useRef(0);

  const createAlertTriggers = watch("assetAlertCriteria.createMany.data");
  const updateAlertTriggers = watch("assetAlertCriteria.updateMany");
  const deleteAlertTriggers = watch("assetAlertCriteria.deleteMany");

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
    form.setValue(
      "assetAlertCriteria.deleteMany",
      [...(deleteAlertTriggers ?? []), { id }],
      { shouldDirty: true }
    );
  };

  return (
    <FormProvider {...form}>
      <Form
        className="space-y-4"
        method={"post"}
        action={
          isNew
            ? "?action=add-asset-question"
            : "?action=update-asset-question&questionId=" + assetQuestion?.id
        }
        onSubmit={(e) => {
          form.handleSubmit(e).then(() => {
            onSubmitted?.();
          });
        }}
      >
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="active"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <div className="flex items-center gap-2 space-y-0">
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
        <FormField
          control={form.control}
          name="type"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <RadioGroup
                  {...field}
                  onValueChange={onChange}
                  className="flex gap-4"
                >
                  {AssetQuestionTypes.map((type, idx) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={type}
                        id={"questionStatus" + idx}
                      />
                      <Label
                        className="capitalize"
                        htmlFor={"questionStatus" + idx}
                      >
                        {type.toLowerCase()}
                      </Label>
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
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger className="capitalize" onBlur={onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {AssetQuestionResponseTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="capitalize"
                      >
                        {type.replace("_", " ").toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="mb-4 text-lg font-medium">Alert Triggers</h3>
          <div className="divide-y divide-y-border">
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
        <Button
          type="submit"
          disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Form>
    </FormProvider>
  );
}

// TODO: This is all very messy and should be cleaned up.

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
  return (
    <div className={cn("flex flex-row items-center gap-4", className)}>
      <Button
        size="icon"
        variant="destructive"
        type="button"
        onClick={() => onRemove()}
      >
        <Trash />
      </Button>
      <div className="grid gap-2 grow">
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
                    <SelectTrigger className="capitalize" onBlur={onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {AlertLevels.map((level) => (
                        <SelectItem
                          key={level}
                          value={level}
                          className="capitalize"
                        >
                          {level.replace("_", " ").toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <span className="w-max shrink-0">level alert when:</span>
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
                />
              </FormControl>
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
}

function AlertTriggerInput({
  onValueChange,
  onBlur,
  value,
}: AlertTriggerInputProps) {
  const form = useFormContext<TForm>();
  const { watch } = form;

  const valueType = watch("valueType");

  const allowedOperators = useMemo(
    () => allowedOperatorsForValueType[valueType ?? "TEXT"],
    [valueType]
  );

  const [rawOperator, rawOperand] = useMemo((): [
    keyof typeof ruleOperatorsSchema.shape,
    string | number | true
  ] => {
    if (value?.value !== undefined) {
      if (typeof value.value === "string") {
        return ["equals", value.value];
      }

      const result = Object.entries(value.value).find(
        ([, v]) => v !== undefined
      );
      if (result) {
        return result as [
          keyof typeof ruleOperatorsSchema.shape,
          string | number | true
        ];
      }
    }

    return ["equals", ""];
  }, [value]);

  const [operator, operand] = useMemo(() => {
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
        {(typeof operand === "string" || typeof operand === "number") && (
          <AssetQuestionResponseTypeInput
            valueType={valueType ?? "BINARY"}
            onValueChange={handleChangeOperand}
            onBlur={onBlur}
            value={operand}
          />
        )}
      </div>
    </div>
  );
}

const ruleOperatorLabels: Record<
  keyof typeof ruleOperatorsSchema.shape,
  string
> = {
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
};

const allowedOperatorsForValueType: Record<
  AssetQuestionResponseType,
  (keyof typeof ruleOperatorsSchema.shape)[]
> = {
  BINARY: ["equals", "not"],
  INDETERMINATE_BINARY: ["equals", "not"],
  TEXT: [
    "empty",
    "notEmpty",
    "equals",
    "not",
    "contains",
    "notContains",
    "startsWith",
    "endsWith",
  ],
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
  DATE: ["empty", "notEmpty", "equals", "not", "gt", "gte", "lt", "lte"],
  NUMBER: ["empty", "notEmpty", "equals", "not", "gt", "gte", "lt", "lte"],
  IMAGE: ["empty", "notEmpty"],
};

const cleanOperand = (opr: string, opd: string | number | true) => {
  if (["empty", "notEmpty"].includes(opr)) {
    return true as const;
  }

  if (["gt", "gte", "lt", "lte"].includes(opr)) {
    return Number.isNaN(+opd) ? String(opd) : +opd;
  }

  return opd === true ? "" : String(opd);
};
