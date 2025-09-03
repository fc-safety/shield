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
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ViewContext } from "~/.server/api-utils";
import ActiveToggleFormInput from "~/components/active-toggle-form-input";
import HelpPopover from "~/components/help-popover";
import LegacyIdField from "~/components/legacy-id-field";
import QuestionResponseTypeDisplay from "~/components/products/question-response-type-display";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { RESPONSE_TYPE_LABELS } from "~/lib/asset-questions/constants";
import { ASSET_QUESTION_TONE_OPTIONS, ASSET_QUESTION_TONES } from "~/lib/constants";
import {
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  type AssetQuestion,
  type AssetQuestionResponseType,
  type ConsumableMappingType,
} from "~/lib/models";
import { createAssetQuestionSchema, updateAssetQuestionSchema } from "~/lib/schema";
import { humanize, nullValuesToUndefined } from "~/lib/utils";
import {
  AssetQuestionDetailFormProvider,
  useAssetQuestionDetailFormContext,
} from "./asset-question-detail-form.context";
import FormSidepanel from "./components/form-sidepanel";
import AlertTriggersInput from "./components/inputs/alert-triggers-input";
import AutomaticSupplySetupInput from "./components/inputs/automatic-supply-setup-input";
import ConditionsInput from "./components/inputs/conditions-input";
import FilesInput from "./components/inputs/files-input";
import RegulatoryCodesInput from "./components/inputs/regulatory-codes-input";
import SelectOptionsInput from "./components/inputs/select-options-input";
import SetMetadataInput from "./components/inputs/set-metadata-input";

type TForm = z.infer<typeof updateAssetQuestionSchema | typeof createAssetQuestionSchema>;

export interface AssetQuestionDetailFormProps {
  assetQuestion?: AssetQuestion;
  onSubmitted?: () => void;
  viewContext?: ViewContext;
}

const FORM_DEFAULTS = {
  active: true,
  type: "INSPECTION",
  required: true,
  prompt: "",
  valueType: "BINARY",
} satisfies TForm;

export default function AssetQuestionDetailForm({
  ...passthroughProps
}: AssetQuestionDetailFormProps) {
  const { assetQuestion } = passthroughProps;
  return (
    <AssetQuestionDetailFormProvider action={assetQuestion ? "update" : "create"}>
      <AssetQuestionDetailsFormContent {...passthroughProps} />
    </AssetQuestionDetailFormProvider>
  );
}

function AssetQuestionDetailsFormContent({
  assetQuestion,
  onSubmitted,
  viewContext,
}: AssetQuestionDetailFormProps) {
  const isNew = !assetQuestion;
  const { closeSidepanel } = useAssetQuestionDetailFormContext();

  const form = useForm({
    resolver: zodResolver(assetQuestion ? updateAssetQuestionSchema : createAssetQuestionSchema),
    values: (assetQuestion
      ? {
          ...assetQuestion,
          order: assetQuestion.order ?? undefined,
          selectOptions: assetQuestion.selectOptions ?? undefined,
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
          variants: undefined,
          conditions: {
            updateMany: assetQuestion.conditions?.map((c) => ({
              where: { id: c.id },
              data: { ...c },
            })),
          },
          files: {
            updateMany: assetQuestion.files?.map((f) => ({
              where: { id: f.id },
              data: { ...f },
            })),
          },
          regulatoryCodes: assetQuestion.regulatoryCodes
            ? {
                update: assetQuestion.regulatoryCodes.map((rc) => ({
                  where: { id: rc.id },
                  data: { ...nullValuesToUndefined(rc) },
                })),
              }
            : undefined,
          setAssetMetadataConfig: assetQuestion.setAssetMetadataConfig
            ? {
                update: assetQuestion.setAssetMetadataConfig,
              }
            : undefined,
        }
      : {
          ...FORM_DEFAULTS,
        }) as TForm,
    mode: "onChange",
  });

  const {
    formState: { isDirty, isValid },
    watch,
    getFieldState,
  } = form;

  const type = watch("type");
  const autoSetupSupplyConfigInput = watch("consumableConfig");

  const autoSetupSupplyConfig = useMemo(() => {
    if (!autoSetupSupplyConfigInput) return;

    if (
      "update" in autoSetupSupplyConfigInput &&
      autoSetupSupplyConfigInput.update?.consumableProduct?.connect?.id
    ) {
      return autoSetupSupplyConfigInput.update;
    }

    if (autoSetupSupplyConfigInput.create) {
      return autoSetupSupplyConfigInput.create;
    }
  }, [autoSetupSupplyConfigInput]);

  const requiredValueType =
    autoSetupSupplyConfig?.mappingType &&
    consumableConfigMappingTypeToResponseType[autoSetupSupplyConfig.mappingType];

  useEffect(() => {
    if (requiredValueType) {
      form.setValue("valueType", requiredValueType);
    }
  }, [requiredValueType, form]);

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

  useEffect(() => {
    closeSidepanel();
  }, [type]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    if (data.type === "SETUP") {
      if (assetQuestion?.assetAlertCriteria?.length) {
        data.assetAlertCriteria = {
          deleteMany: assetQuestion.assetAlertCriteria.map((c) => ({
            id: c.id,
          })),
        };
      } else {
        data.assetAlertCriteria = undefined;
      }
    } else {
      if (assetQuestion?.consumableConfig) {
        data.consumableConfig = {
          delete: true,
        };
      } else {
        data.consumableConfig = undefined;
      }
    }

    // Remove undefined values to make it JSON-serializable
    const cleanedData = JSON.parse(JSON.stringify(data));
    submit(cleanedData, {
      path: `/api/proxy/asset-questions`,
      id: assetQuestion?.id,
      viewContext,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex"
        onSubmit={form.handleSubmit(handleSubmit, (e) => {
          console.error("Form is invalid:", e);
        })}
      >
        <div className="flex-1 space-y-4 p-4">
          <Input type="hidden" {...form.register("id")} hidden />
          <ActiveToggleFormInput />
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
                <div className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={value}
                      onCheckedChange={onChange}
                      className="pt-0"
                      onBlur={onBlur}
                    />
                  </FormControl>
                  <FormLabel>
                    {value ? (
                      <span>
                        <span className="text-urgent font-bold">*</span> (Required)
                      </span>
                    ) : (
                      "(Optional)"
                    )}
                  </FormLabel>
                </div>
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
                          <QuestionResponseTypeDisplay valueType={type} tone={tone} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {valueType && SELECT_SUPPORTED_VALUE_TYPES.includes(valueType) && (
            <FormField
              control={form.control}
              name="selectOptions"
              render={() => (
                <FormItem>
                  <FormLabel>{RESPONSE_TYPE_LABELS[valueType]} Options</FormLabel>
                  <FormControl>
                    <SelectOptionsInput />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                        For example, a "Positive" tone will display a green checkmark when the
                        answer is "Yes". "Negative" will display a red X when the answer is "Yes".
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

          {type === "SETUP" && <AutomaticSupplySetupInput />}

          {(type === "INSPECTION" || type === "SETUP_AND_INSPECTION") && <AlertTriggersInput />}

          <ConditionsInput />

          <FilesInput />

          <RegulatoryCodesInput />

          <SetMetadataInput />

          <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
        <FormSidepanel />
      </form>
    </FormProvider>
  );
}

const consumableConfigMappingTypeToResponseType: Record<
  ConsumableMappingType,
  AssetQuestionResponseType
> = {
  EXPIRATION_DATE: "DATE",
};

const TONE_SUPPORTED_VALUE_TYPES: AssetQuestionResponseType[] = ["BINARY", "INDETERMINATE_BINARY"];

const SELECT_SUPPORTED_VALUE_TYPES: AssetQuestionResponseType[] = ["SELECT"];
