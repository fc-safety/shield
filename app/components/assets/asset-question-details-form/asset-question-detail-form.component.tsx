import { Button } from "@/components/ui/button";
import { extractErrorMessage, Form as FormProvider } from "@/components/ui/form";
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
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import ActiveToggleFormInput from "~/components/active-toggle-form-input";
import HelpPopover from "~/components/help-popover";
import QuestionResponseTypeDisplay from "~/components/products/question-response-type-display";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "~/components/ui/field";
import { Separator } from "~/components/ui/separator";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { RESPONSE_TYPE_LABELS } from "~/lib/asset-questions/constants";
import { ASSET_QUESTION_TONE_OPTIONS, ASSET_QUESTION_TONES } from "~/lib/constants";
import { connectOrEmpty, toUpdateMany } from "~/lib/model-form-converters";
import {
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  type AssetQuestion,
  type AssetQuestionResponseType,
  type ConsumableMappingType,
} from "~/lib/models";
import { createAssetQuestionSchema, updateAssetQuestionSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import { humanize, nullValuesToUndefined } from "~/lib/utils";
import { ResponsiveModalBody, ResponsiveModalFooter } from "../../responsive-modal";
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
  clientId?: string;
}
export default function AssetQuestionDetailForm({
  ...passthroughProps
}: AssetQuestionDetailFormProps) {
  const { assetQuestion, clientId } = passthroughProps;
  return (
    <AssetQuestionDetailFormProvider
      action={assetQuestion ? "update" : "create"}
      clientId={clientId}
    >
      <AssetQuestionDetailsFormContent {...passthroughProps} />
    </AssetQuestionDetailFormProvider>
  );
}

function AssetQuestionDetailsFormContent({
  assetQuestion,
  onSubmitted,
  clientId,
}: AssetQuestionDetailFormProps) {
  const isNew = !assetQuestion;
  const { closeSidepanel } = useAssetQuestionDetailFormContext();

  const FORM_DEFAULTS = useMemo(
    () =>
      ({
        active: true,
        type: "INSPECTION",
        required: true,
        prompt: "",
        valueType: "BINARY",
        tone: ASSET_QUESTION_TONES.POSITIVE,
        conditions: {
          createMany: {
            data: [],
          },
        },
        client: connectOrEmpty(clientId),
      }) satisfies TForm,
    [clientId]
  );

  const form = useForm({
    resolver: zodResolver(!isNew ? updateAssetQuestionSchema : createAssetQuestionSchema),
    values: (!isNew
      ? {
          ...nullValuesToUndefined(assetQuestion),
          assetAlertCriteria: {
            updateMany: toUpdateMany(assetQuestion.assetAlertCriteria),
          },
          consumableConfig: assetQuestion.consumableConfig
            ? {
                update: {
                  consumableProduct: connectOrEmpty(
                    assetQuestion.consumableConfig,
                    "consumableProductId"
                  ),
                  mappingType: assetQuestion.consumableConfig.mappingType,
                },
              }
            : undefined,
          tone: assetQuestion?.tone ?? ASSET_QUESTION_TONES.NEUTRAL,
          client: connectOrEmpty(assetQuestion, "clientId") ?? connectOrEmpty(clientId),
          variants: undefined,
          conditions: {
            updateMany: toUpdateMany(assetQuestion.conditions),
          },
          files: {
            updateMany: toUpdateMany(assetQuestion.files),
          },
          regulatoryCodes: assetQuestion.regulatoryCodes
            ? {
                update: toUpdateMany(assetQuestion.regulatoryCodes),
              }
            : undefined,
          setAssetMetadataConfig: assetQuestion.setAssetMetadataConfig
            ? {
                update: {
                  ...assetQuestion.setAssetMetadataConfig,
                  metadata: assetQuestion.setAssetMetadataConfig.metadata?.map((m) => ({
                    ...nullValuesToUndefined(m),
                  })),
                },
              }
            : undefined,
        }
      : undefined) as TForm | undefined,
    defaultValues: !isNew ? undefined : (FORM_DEFAULTS as TForm),
    mode: "onChange",
  });

  const {
    formState: { isDirty },
    watch,
    getFieldState,
    setValue,
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
    const subscription = watch(({ valueType, tone, type }, { name, type: watchType }) => {
      if ((name === "valueType" || name === "type") && watchType === "change") {
        if (
          isNew &&
          valueType &&
          type &&
          TONE_SUPPORTED_VALUE_TYPES.includes(valueType) &&
          !getFieldState("tone").isTouched
        ) {
          if (
            ["INSPECTION", "SETUP_AND_INSPECTION", "SETUP"].includes(type) &&
            tone !== ASSET_QUESTION_TONES.POSITIVE
          ) {
            setValue("tone", ASSET_QUESTION_TONES.POSITIVE, {
              shouldDirty: true,
            });
          } else if (["CONFIGURATION"].includes(type) && tone !== ASSET_QUESTION_TONES.NEUTRAL) {
            setValue("tone", ASSET_QUESTION_TONES.NEUTRAL, {
              shouldDirty: true,
            });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isNew, getFieldState, setValue]);

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

    submit(serializeFormJson(data), {
      path: `/api/proxy/asset-questions`,
      id: assetQuestion?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={form.handleSubmit(handleSubmit, (e) => {
          toast.error("Please fix the errors in the form.", {
            description: extractErrorMessage(e),
            duration: 10000,
          });
        })}
      >
        <div className="relative flex min-h-0 flex-1">
          <ResponsiveModalBody className="flex-1 space-y-6 p-4">
            <Input type="hidden" {...form.register("id")} hidden />

            {/* Question Setup */}
            <FieldSet>
              <FieldLegend>Question Setup</FieldLegend>
              <FieldGroup>
                <ActiveToggleFormInput helpPopoverContent="Only active questions will be displayed to inspectors." />
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field: { onChange, ...field }, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="inline-flex items-center gap-1">
                        Type
                        <HelpPopover>
                          <p>
                            The type determines whether this question is displayed during initial
                            setup, during every subsequent inspection, or both.
                          </p>
                          <br />
                          <p>
                            Configuration type questions are a special type that is designed to
                            configure arbitrary metadata on the asset, useful for storing
                            information beyond what the system readily provides. Examples include
                            subcategories, unique product types, etc. Used in conjunction with
                            inspection question conditions, these can be a powerful way to
                            dynamically present questions to inspectors.
                          </p>
                        </HelpPopover>
                      </FieldLabel>
                      <RadioGroup {...field} onValueChange={onChange} className="flex gap-4">
                        {AssetQuestionTypes.map((type, idx) => (
                          <div key={type} className="flex items-center space-x-2">
                            <RadioGroupItem value={type} id={"questionStatus" + idx} />
                            <Label htmlFor={"questionStatus" + idx}>{humanize(type)}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <Separator />

            {/* Prompt & Response */}
            <FieldSet>
              <FieldLegend>Prompt & Response</FieldLegend>
              <FieldDescription>
                This is what inspectors see during an inspection. Write a clear prompt that helps
                them provide an accurate response.
              </FieldDescription>
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="required"
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex flex-row items-center gap-2 space-y-0">
                        <Switch
                          checked={value}
                          onCheckedChange={onChange}
                          className="pt-0"
                          onBlur={onBlur}
                        />
                        <FieldLabel className="inline-flex items-center gap-1">
                          {value ? (
                            <span>
                              <span className="text-urgent font-bold">*</span> This question is
                              required
                            </span>
                          ) : (
                            "This question is optional"
                          )}
                          <HelpPopover>
                            <p>
                              Required questions must be answered before the inspection can be
                              completed.
                            </p>
                          </HelpPopover>
                        </FieldLabel>
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="prompt"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="inline-flex items-center gap-1">
                        Prompt *
                        <HelpPopover>
                          <p>
                            This is what prompts the response from the inspector, usually a question
                            relating to the condition of the asset.
                          </p>
                        </HelpPopover>
                      </FieldLabel>
                      <Textarea {...field} rows={2} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="valueType"
                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="inline-flex items-center gap-1">
                          Answer Type *
                          <HelpPopover>
                            <p>
                              The type of answer that is expected from the inspector. This
                              determines what kind of input is displayed (e.g. text input, dropdown,
                              etc.).
                            </p>
                          </HelpPopover>
                        </FieldLabel>
                        <Select
                          value={value}
                          onValueChange={onChange}
                          disabled={!!requiredValueType}
                        >
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
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {valueType && TONE_SUPPORTED_VALUE_TYPES.includes(valueType) && (
                    <Controller
                      control={form.control}
                      name="tone"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="flex items-center gap-1">
                            Tone
                            <HelpPopover classNames={{ content: "space-y-2" }}>
                              <p>The tone is used to provide visual aids to inspectors.</p>
                              <p>
                                For example, a "Positive" tone will display a green checkmark when
                                the answer is "Yes". "Negative" will display a red X when the answer
                                is "Yes".
                              </p>
                            </HelpPopover>
                          </FieldLabel>
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
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  )}
                </div>

                {valueType && SELECT_SUPPORTED_VALUE_TYPES.includes(valueType) && (
                  <Controller
                    control={form.control}
                    name="selectOptions"
                    render={({ fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="inline-flex items-center gap-1">
                          {RESPONSE_TYPE_LABELS[valueType]} Options *
                          <HelpPopover>
                            <p>The options that are available for the inspector to select from.</p>
                          </HelpPopover>
                        </FieldLabel>
                        <SelectOptionsInput />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                )}

                <Controller
                  control={form.control}
                  name="helpText"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="inline-flex items-center gap-1">
                        Help Text
                        <HelpPopover>
                          <p>
                            This is additional, optional text that can be displayed to the inspector
                            to help them answer the question.
                          </p>
                        </HelpPopover>
                      </FieldLabel>
                      <Textarea {...field} rows={1} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <Separator />

            {/* Visibility & Alerts */}
            <FieldSet>
              <FieldLegend>Visibility & Alerts</FieldLegend>
              <FieldDescription>
                Conditions control when this question appears during an inspection. At least one
                condition is required for the question to be shown.
              </FieldDescription>
              <FieldGroup>
                <ConditionsInput />

                {(type === "INSPECTION" || type === "SETUP_AND_INSPECTION") && (
                  <AlertTriggersInput />
                )}

                {type === "SETUP" && <AutomaticSupplySetupInput />}
              </FieldGroup>
            </FieldSet>

            <Separator />

            {/* Attachments & Compliance */}
            <FieldSet>
              <FieldLegend>Attachments & Compliance</FieldLegend>
              <FieldDescription>
                Optionally attach files, regulatory codes, or metadata to provide inspectors with
                additional context.
              </FieldDescription>
              <FieldGroup>
                <FilesInput />

                {(type === "INSPECTION" || type === "SETUP_AND_INSPECTION" || type === "SETUP") && (
                  <RegulatoryCodesInput />
                )}

                <SetMetadataInput requireDynamic={type === "CONFIGURATION"} />
              </FieldGroup>
            </FieldSet>
          </ResponsiveModalBody>
          <FormSidepanel />
        </div>
        <ResponsiveModalFooter>
          <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </ResponsiveModalFooter>
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
