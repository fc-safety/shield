import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, type RefObject } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type z from "zod";
import type { DataOrError, ViewContext } from "~/.server/api-utils";
import AssetQuestionFormInputLabel from "~/components/assets/asset-question-form-input-label";
import AssetQuestionResponseField from "~/components/assets/asset-question-response-field";
import { Form, FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Asset, AssetQuestion } from "~/lib/models";
import { buildConfigureAssetSchema } from "~/lib/schema";
import { Button } from "../ui/button";

export type ConfigureAssetFormRef = {
  handleSubmit: () => void;
};

export default function ConfigureAssetForm({
  assetId,
  questions,
  viewContext,
  onSubmitted,
  setIsValid,
  setIsSubmitting,
  ref,
  showSubmitButton = false,
  submitButtonText = "Save",
}: {
  assetId: string;
  questions: AssetQuestion[];
  viewContext?: ViewContext;
  onSubmitted?: () => void;
  setIsValid?: (isValid: boolean) => void;
  setIsSubmitting?: (isSubmitting: boolean) => void;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  ref?: RefObject<ConfigureAssetFormRef | null>;
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

  useEffect(() => {
    setIsValid?.(isValid);
  }, [isValid]);

  useEffect(() => {
    setIsSubmitting?.(isSubmitting);
  }, [isSubmitting]);

  useEffect(() => {
    if (ref) {
      ref.current = {
        handleSubmit: () => handleConfigureAsset({ onSubmitted }),
      };
    }
  }, [ref]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => handleConfigureAsset({ data, onSubmitted }))}
        className="space-y-4"
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
                  <AssetQuestionFormInputLabel question={question} />
                  <FormControl>
                    <AssetQuestionResponseField
                      value={value ?? ""}
                      onValueChange={onChange}
                      onBlur={onBlur}
                      question={question}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
        {showSubmitButton && (
          <Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Processing..." : submitButtonText}
          </Button>
        )}
      </form>
    </Form>
  );
}
