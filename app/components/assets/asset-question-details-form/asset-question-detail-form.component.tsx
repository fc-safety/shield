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
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Eraser, Loader2, Pencil, Wrench } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import HelpPopover from "~/components/help-popover";
import LegacyIdField from "~/components/legacy-id-field";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { ASSET_QUESTION_TONE_OPTIONS, ASSET_QUESTION_TONES } from "~/lib/constants";
import {
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  type AssetQuestion,
  type AssetQuestionResponseType,
  type ConsumableMappingType,
  type Product,
  type ResultsPage,
} from "~/lib/models";
import { createAssetQuestionSchema, updateAssetQuestionSchema } from "~/lib/schema";
import { humanize } from "~/lib/utils";
import {
  AssetQuestionDetailFormProvider,
  useAssetQuestionDetailFormContext,
} from "./asset-question-detail-form.context";
import FormSidepanel from "./components/form-sidepanel";
import AlertTriggersInput from "./components/inputs/alert-triggers-input";
import ConditionsInput from "./components/inputs/conditions-input";
import FilesInput from "./components/inputs/files-input";
import { AutoSetupSupplyConfigurator } from "./components/sidepanel-inserts/auto-setup-supply-configurator";

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
  return (
    <AssetQuestionDetailFormProvider action={assetQuestion ? "update" : "create"}>
      <AssetQuestionDetailsFormContent assetQuestion={assetQuestion} onSubmitted={onSubmitted} />
    </AssetQuestionDetailFormProvider>
  );
}

function AssetQuestionDetailsFormContent({
  assetQuestion,
  onSubmitted,
}: AssetQuestionDetailFormProps) {
  const isNew = !assetQuestion;
  const { openSidepanel, closeSidepanel } = useAssetQuestionDetailFormContext();
  const { fetchOrThrow } = useAuthenticatedFetch();

  const form = useForm({
    resolver: zodResolver(assetQuestion ? updateAssetQuestionSchema : createAssetQuestionSchema),
    values: (assetQuestion
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

  const autoSetupSupplyProductId = autoSetupSupplyConfig?.consumableProduct?.connect?.id;

  const { data: autoSetupSupply, isLoading: isLoadingAutoSetupSupply } = useQuery({
    queryKey: ["products", autoSetupSupplyProductId],
    queryFn: ({ queryKey }) =>
      fetchOrThrow(`/products/?id=${queryKey[1]}&include[parentProduct]=true`, { method: "GET" })
        .then((r) => r.json() as Promise<ResultsPage<Product>>)
        .then((products) => products.results.at(0)),
    enabled: !!autoSetupSupplyProductId,
  });

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
    });
  };

  return (
    <FormProvider {...form}>
      <form className="flex" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex-1 space-y-4 p-4">
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

          <FilesInput />

          <ConditionsInput />

          {type === "SETUP" && (
            <div>
              <h3 className="mb-2 inline-flex items-center gap-2 text-base font-medium">
                Automatic Supply Setup
                {autoSetupSupplyConfig && (
                  <>
                    <Button
                      size="iconSm"
                      variant="outline"
                      type="button"
                      onClick={() => openSidepanel(AutoSetupSupplyConfigurator.Id)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="iconSm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        if (!autoSetupSupplyConfigInput) return;
                        if (!assetQuestion?.consumableConfig) {
                          form.setValue("consumableConfig", undefined, {
                            shouldDirty: true,
                          });
                        } else {
                          form.setValue(
                            "consumableConfig",
                            {
                              delete: true,
                            },
                            {
                              shouldDirty: true,
                            }
                          );
                        }
                        closeSidepanel();
                      }}
                    >
                      <Eraser className="text-destructive" />
                    </Button>
                  </>
                )}
              </h3>
              <div className="space-y-4">
                {autoSetupSupplyConfig ? (
                  <div className="text-sm">
                    A{" "}
                    <div className="border-border inline-block rounded-sm border px-1 py-0.5">
                      {isLoadingAutoSetupSupply ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : autoSetupSupply ? (
                        <div className="flex items-center gap-1">
                          {autoSetupSupply.parentProduct?.name}
                          <ChevronRight className="size-3" />
                          {autoSetupSupply.name}
                        </div>
                      ) : (
                        "unknown supply"
                      )}
                    </div>{" "}
                    will be setup under the asset with the question response as the{" "}
                    <div className="border-border inline-block rounded-sm border px-1 py-0.5">
                      {autoSetupSupplyConfig.mappingType === "EXPIRATION_DATE"
                        ? "expiration date"
                        : "unknown"}
                    </div>
                    .
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => {
                      form.setValue(
                        "consumableConfig",
                        assetQuestion?.consumableConfig
                          ? {
                              update: {
                                consumableProduct: {
                                  connect: {
                                    id: assetQuestion.consumableConfig.consumableProductId,
                                  },
                                },
                                mappingType: assetQuestion.consumableConfig.mappingType,
                              },
                            }
                          : {
                              create: {
                                consumableProduct: {
                                  connect: {
                                    id: "",
                                  },
                                },
                                mappingType: "EXPIRATION_DATE",
                              },
                            },
                        {
                          shouldDirty: true,
                        }
                      );
                      openSidepanel(AutoSetupSupplyConfigurator.Id);
                    }}
                  >
                    <Wrench />
                    Configure
                  </Button>
                )}
              </div>
            </div>
          )}

          {(type === "INSPECTION" || type === "SETUP_AND_INSPECTION") && <AlertTriggersInput />}
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
