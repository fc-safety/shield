import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CircleSlash, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { catchResponse } from "~/.server/api-utils";
import { validateInspectionSession } from "~/.server/inspections";
import AssetQuestionFilesDisplay from "~/components/assets/asset-question-files-display";
import AssetQuestionRegulatoryCodesDisplay from "~/components/assets/asset-question-regulatory-codes-display";
import AssetQuestionResponseTypeInput from "~/components/assets/asset-question-response-input";
import { useCreateAssetAssistant } from "~/components/assets/create-asset-assistant/create-asset-assistant.component";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import Step from "~/components/assistant/components/step";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { ASSET_QUESTION_TONES } from "~/lib/constants";
import type { AssetQuestion } from "~/lib/models";
import { buildSetupAssetSchema, registerTagSchema, setupAssetSchema } from "~/lib/schema";
import { buildPath } from "~/lib/urls";
import { can } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/register";
import SuccessCircle from "./components/success-circle";

export const handle = {
  breadcrumb: () => ({ label: "Register Tag" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { inspectionToken } = await validateInspectionSession(request);

  const {
    data: { data: tag },
  } = await catchResponse(api.tags.checkRegistration(request, inspectionToken), {
    codes: [404],
  });

  let setupQuestions: AssetQuestion[] = [];
  if (tag?.asset && tag.asset.setupOn === null) {
    setupQuestions = await api.assetQuestions.findByAsset(request, tag.asset.id, "SETUP");
  }

  return { tag, inspectionToken, setupQuestions };
};

type TRegisterForm = z.infer<typeof registerTagSchema>;

export default function InspectRegister({
  loaderData: { tag, inspectionToken, setupQuestions },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canRegister = can(user, "register", "tags") && can(user, "create", "assets");

  const [recentlyRegistered, setRecentlyRegistered] = useState(false);

  const { submitJson: submitRegisterTag, isSubmitting } = useModalFetcher<TRegisterForm>();

  const handleSubmit = (data: TRegisterForm) => {
    setRecentlyRegistered(true);
    submitRegisterTag(data as any, {
      method: "POST",
      path: "/api/proxy/tags/register-tag",
      query: {
        _inspectionToken: inspectionToken,
      },
    });
  };

  return (
    <div className="my-8 flex h-full w-full max-w-sm flex-col items-center justify-center self-center">
      <div className="h-[42rem] max-h-[calc(100dvh-10rem)] w-full">
        <RegisterAssetAssistant
          assetId={tag?.asset?.id}
          canRegister={canRegister}
          isRegistered={!!tag?.asset}
          isRegisteredRecently={recentlyRegistered}
          onRegister={(assetId) =>
            handleSubmit({
              client: undefined,
              site: undefined,
              asset: {
                connect: {
                  id: assetId,
                },
              },
            })
          }
          isRegistering={isSubmitting}
          setupRequired={setupQuestions.length > 0 && tag?.asset?.setupOn === null}
          setupQuestions={setupQuestions}
        />
      </div>
    </div>
  );
}

const setupSchema = setupAssetSchema.omit({ setupOn: true });
type TSetupForm = z.infer<typeof setupSchema>;

function RegisterAssetAssistant({
  assetId,
  canRegister,
  isRegistered,
  isRegisteredRecently,
  onRegister,
  isRegistering,
  setupRequired,
  setupQuestions,
}: {
  assetId?: string;
  canRegister: boolean;
  isRegistered: boolean;
  isRegisteredRecently: boolean;
  onRegister: (assetId: string) => void;
  isRegistering: boolean;
  setupRequired?: boolean;
  setupQuestions?: AssetQuestion[] | null;
}) {
  const assistant = useAssistant({
    firstStepId: StepInitial.StepId,
  });

  const { stepTo } = assistant;

  const handleRegister = (assetId: string) => {
    onRegister(assetId);
    stepTo(StepInitial.StepId, "forward");
  };

  const { renderStep: renderCreateAssetAssistantStep, firstStepId: createAssetFirstStepId } =
    useCreateAssetAssistant({
      onStepBackward: () => {
        stepTo(StepInitial.StepId, "backward");
      },
      onContinue: (data) => {
        handleRegister(data.id);
      },
      continueLabel: "Register",
      state: {
        assetData: {
          id: assetId,
        },
      },
      viewContext: "user",
    });

  return (
    <AssistantProvider
      context={assistant}
      renderStep={(context) => {
        const { stepId, stepTo } = context;
        switch (stepId) {
          case StepInitial.StepId:
            return (
              <StepInitial
                isRegistered={isRegistered}
                isRegisteredRecently={isRegisteredRecently}
                canRegister={canRegister}
                onRegister={() => stepTo(createAssetFirstStepId, "forward")}
                isRegistering={isRegistering}
                setupRequired={setupRequired}
                onSetup={() => stepTo(StepCompleteAssetSetup.StepId, "forward")}
              />
            );
          case StepCompleteAssetSetup.StepId:
            return (
              <StepCompleteAssetSetup
                setupQuestions={setupQuestions ?? []}
                assetId={assetId ?? ""}
              />
            );
          default:
            return renderCreateAssetAssistantStep(context);
        }
      }}
    />
  );
}

function StepInitial({
  isRegistered,
  isRegisteredRecently,
  canRegister,
  onRegister,
  isRegistering,
  setupRequired,
  onSetup,
}: {
  isRegistered: boolean;
  isRegisteredRecently: boolean;
  canRegister: boolean;
  onRegister: () => void;
  isRegistering: boolean;
  setupRequired?: boolean;
  onSetup: () => void;
}) {
  return (
    <Step>
      <div className="flex flex-col items-center justify-center gap-4">
        {isRegistering ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <Loader2 className="text-muted-foreground size-16 animate-spin" />
            <h2 className="text-lg font-semibold">Registering tag to asset...</h2>
          </div>
        ) : isRegistered ? (
          <>
            <div className="flex flex-col items-center justify-center gap-1">
              <SuccessCircle />
              <h2 className="text-center text-lg font-semibold">
                This tag is {isRegisteredRecently ? "now" : "already"} registered to an asset.
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              {setupRequired && (
                <Alert variant="default">
                  <AlertTitle>Additonal Setup Required</AlertTitle>
                  <AlertDescription>
                    Before you can begin inspecting, this asset requires additional setup.
                  </AlertDescription>
                </Alert>
              )}
              {setupRequired ? (
                <Button onClick={onSetup} type="button">
                  Continue with setup <ArrowRight />
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/inspect">
                    Begin inspection <ArrowRight />
                  </Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center gap-1">
              <CircleSlash className="text-destructive size-16" />
              <h2 className="text-lg font-semibold">This tag is not registered to an asset.</h2>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              {!canRegister && (
                <p className="text-destructive text-center text-sm">
                  You do not have permission to register tags.
                </p>
              )}
              <Button
                key="open-form-button"
                type="button"
                onClick={onRegister}
                disabled={!canRegister}
                className="w-full"
              >
                Register Tag
              </Button>
            </div>
          </>
        )}
      </div>
    </Step>
  );
}

StepInitial.StepId = "initial";

function StepCompleteAssetSetup({
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

const MotionButton = motion(Button);
