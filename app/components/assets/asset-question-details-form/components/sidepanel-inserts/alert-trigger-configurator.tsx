import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, OctagonAlert } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type z from "zod";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import HelpPopover from "~/components/help-popover";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { AlertLevels, type AssetQuestionResponseType } from "~/lib/models";
import type {
  CreateAssetAlertCriterionRule,
  ruleOperatorsSchema,
  updateAssetQuestionSchema,
} from "~/lib/schema";
import type { ResponseValueImage } from "~/lib/types";
import { cn, humanize } from "~/lib/utils";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";
import { alertTriggerVariants } from "../../utils/styles";

type TForm = Pick<
  z.infer<typeof updateAssetQuestionSchema>,
  "assetAlertCriteria" | "tone" | "valueType"
>;

export const AlertTriggerConfigurator = () => {
  const { data: contextData } = useAssetQuestionDetailFormContext();

  const { watch, control } = useFormContext<TForm>();

  const idx = (contextData.idx ?? 0) as number;
  const alertAction = contextData.action as "create" | "update";

  const alertCriteriaDataInput = watch(
    alertAction === "create"
      ? `assetAlertCriteria.createMany.data.${idx}`
      : `assetAlertCriteria.updateMany.${idx}.data`
  );
  const tone = watch("tone");

  return alertCriteriaDataInput ? (
    <div className="space-y-6" key={`${idx}-${alertAction}`}>
      <div>
        <h3 className="text-lg font-medium">Configure Alert Trigger</h3>
        <p className="text-muted-foreground text-sm">
          Alert triggers can be configured based on how an inspector answers this question during an
          inspection.
        </p>
      </div>
      <div className="grid grow gap-2">
        <FormField
          control={control}
          name={
            alertAction === "create"
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
                      className={cn(alertTriggerVariants({ alertLevel: value }))}
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
          control={control}
          name={
            alertAction === "create"
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
          control={control}
          name={
            alertAction === "create"
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
                      If enabled, the alert will be automatically resolved when it is triggered, not
                      prompting any follow-up action.
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
  ) : (
    <Loader2 className="size-4 animate-spin" />
  );
};

AlertTriggerConfigurator.Id = "alert-trigger-configurator";

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

export const ruleOperatorLabels: Record<RuleOperator, string> = {
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
