import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type z from "zod";
import type { DataOrError, ViewContext } from "~/.server/api-utils";
import AssetQuestionFilesDisplay from "~/components/assets/asset-question-files-display";
import AssetQuestionRegulatoryCodesDisplay from "~/components/assets/asset-question-regulatory-codes-display";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import Step from "~/components/assistant/components/step";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { ASSET_QUESTION_TONES } from "~/lib/constants";
import type { Asset, AssetQuestion } from "~/lib/models";
import { buildConfigureAssetSchema } from "~/lib/schema";

export default function StepConfigureAsset({
  assetId,
  questions,
  onStepBackward,
  onContinue,
  continueLabel,
  onClose,
  viewContext,
}: {
  assetId: string;
  questions: AssetQuestion[];
  onStepBackward: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  onClose?: () => void;
  viewContext?: ViewContext;
}) {
  const narrowedConfigureAssetSchema = useMemo(() => {
    return buildConfigureAssetSchema(questions);
  }, [questions]);

  const form = useForm({
    resolver: zodResolver(narrowedConfigureAssetSchema),
    values: {
      responses: questions.map((question) => ({
        value: "",
        assetQuestionId: question.id,
        originalPrompt: question.prompt,
      })),
    },
  });

  const {
    formState: { isValid },
  } = form;

  const { fields: questionFields } = useFieldArray({
    control: form.control,
    name: "responses",
  });

  const { submitJson: submit, isSubmitting } = useModalFetcher<DataOrError<Asset>>();

  const handleConfigureAsset = ({
    onSubmitted,
    data,
  }: {
    onSubmitted?: () => void;
    data?: z.infer<typeof narrowedConfigureAssetSchema>;
  }) => {
    const responseData = data ?? form.getValues();
    submit(responseData, {
      path: "/api/proxy/assets/:id/configure",
      query: {
        id: assetId,
      },
      viewContext: viewContext,
      onSubmitted,
    });
  };

  return (
    <Step
      title="Configure Asset"
      subtitle="Some assets require additional configuration to be ready for inspection."
      onStepBackward={onStepBackward}
      onContinue={
        onContinue
          ? () => {
              handleConfigureAsset({
                onSubmitted: onContinue,
              });
            }
          : undefined
      }
      footerSlotEnd={
        onContinue ? null : (
          <Button
            type="button"
            disabled={!isValid || isSubmitting}
            onClick={() =>
              handleConfigureAsset({
                onSubmitted: onClose,
              })
            }
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save{onClose ? " & Close" : ""}
          </Button>
        )
      }
      continueDisabled={!isValid}
      continueLoading={isSubmitting}
      continueButtonText={continueLabel ? `Save & ${continueLabel}` : "Save & Continue"}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            handleConfigureAsset({ data, onSubmitted: onClose })
          )}
        >
          {questionFields.map((questionField, index) => {
            const question = questions[index];
            return (
              <FormField
                key={questionField.id}
                control={form.control}
                name={`responses.${index}.value`}
                render={({ field: { value, onChange, onBlur } }) => (
                  <FormItem>
                    <div>
                      <FormLabel>
                        {question?.prompt}
                        {question?.required && " *"}
                      </FormLabel>
                      {question?.helpText && (
                        <FormDescription>{question?.helpText}</FormDescription>
                      )}
                      <AssetQuestionRegulatoryCodesDisplay
                        regulatoryCodes={question?.regulatoryCodes}
                      />
                      <AssetQuestionFilesDisplay files={question?.files} />
                    </div>
                    <FormControl>
                      <AssetQuestionResponseTypeInput
                        value={value ?? ""}
                        onValueChange={onChange}
                        onBlur={onBlur}
                        valueType={question?.valueType ?? "BINARY"}
                        tone={question?.tone ?? ASSET_QUESTION_TONES.NEUTRAL}
                        options={question?.selectOptions ?? undefined}
                        placeholder={question?.placeholder}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </form>
      </Form>
    </Step>
  );
}

StepConfigureAsset.StepId = "configure-asset";
