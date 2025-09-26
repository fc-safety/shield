import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router";
import type z from "zod";
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
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { ASSET_QUESTION_TONES } from "~/lib/constants";
import type { AssetQuestion } from "~/lib/models";
import { buildSetupAssetSchema, setupAssetSchema } from "~/lib/schema";
import { buildPath } from "~/lib/urls";

const setupSchema = setupAssetSchema.omit({ setupOn: true });
type TSetupForm = z.infer<typeof setupSchema>;

export default function StepCompleteAssetSetup({
  assetId,
  setupQuestions,
}: {
  assetId: string;
  setupQuestions: AssetQuestion[];
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const [setupComplete, setSetupComplete] = useState(false);

  const narrowedSetupAssetSchema = useMemo(() => {
    return buildSetupAssetSchema(setupQuestions, []);
  }, [setupQuestions]);

  const form = useForm({
    resolver: zodResolver(narrowedSetupAssetSchema),
    values: {
      id: assetId,
      setupQuestionResponses: {
        createMany: {
          data: setupQuestions.map((question) => ({
            value: "",
            originalPrompt: question.prompt,
            assetQuestionId: question.id,
          })),
        },
        updateMany: [],
      },
    },
  });

  const {
    formState: { isValid },
  } = form;

  const { fields: questionFields } = useFieldArray({
    control: form.control,
    name: "setupQuestionResponses.createMany.data",
  });

  const { mutate: setupAsset, isPending: isSubmitting } = useMutation({
    mutationFn: (data: TSetupForm) => {
      return fetchOrThrow(
        buildPath("/assets/:id/setup", {
          id: assetId,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: () => {
      setSetupComplete(true);
    },
  });

  return (
    <Step
      title="Complete questions to finish asset setup."
      subtitle="You will only be required to complete this setup once."
    >
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((data) => setupAsset(data))}
        >
          {setupQuestions.filter((q) => q.required).length > 0 && (
            <p className="text-muted-foreground text-sm">* indicates a required field</p>
          )}
          {questionFields.map(({ id: key, ...data }, index) => {
            const question = setupQuestions.find((q) => q.id === data.assetQuestionId);
            return (
              <FormField
                key={key}
                control={form.control}
                name={`setupQuestionResponses.createMany.data.${index}.value`}
                render={({ field: { value, onChange, onBlur } }) => (
                  <FormItem>
                    <div>
                      <FormLabel>
                        {question?.prompt ?? (
                          <span className="italic">
                            Prompt for this question has been removed or is not available.
                          </span>
                        )}
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
                        value={value}
                        onValueChange={onChange}
                        onBlur={onBlur}
                        valueType={question?.valueType ?? "BINARY"}
                        disabled={!question || setupComplete}
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

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              variant={setupComplete ? "secondary" : "default"}
              disabled={setupComplete || isSubmitting || !isValid}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isSubmitting ? "Processing..." : setupComplete ? "Setup Complete" : "Complete Setup"}
            </Button>
            <AnimatePresence>
              {setupComplete && (
                <MotionButton
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  variant="default"
                  type="button"
                  asChild
                >
                  <Link to={`/inspect/`}>
                    Begin inspection <ArrowRight />
                  </Link>
                </MotionButton>
              )}
            </AnimatePresence>
          </div>
        </form>
      </Form>
    </Step>
  );
}

StepCompleteAssetSetup.StepId = "complete-asset-setup";

const MotionButton = motion.create(Button);
