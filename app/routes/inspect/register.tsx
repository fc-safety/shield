import { CircleSlash, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { catchResponse } from "~/.server/api-utils";
import { validateInspectionSession } from "~/.server/inspections";
import { useCreateAssetAssistant } from "~/components/assets/create-asset-assistant/create-asset-assistant.component";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import Step from "~/components/assistant/components/step";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { registerTagSchema } from "~/lib/schema";
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

  return { tag, inspectionToken };
};

type TForm = z.infer<typeof registerTagSchema>;

export default function InspectRegister({
  loaderData: { tag, inspectionToken },
}: Route.ComponentProps) {
  const { user } = useAuth();
  const canRegister = can(user, "register", "tags") && can(user, "create", "assets");

  const [recentlyRegistered, setRecentlyRegistered] = useState(false);

  const { submitJson: submitRegisterTag, isSubmitting } = useModalFetcher<TForm>();

  const handleSubmit = (data: TForm) => {
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
        />
      </div>
    </div>
  );
}

function RegisterAssetAssistant({
  assetId,
  canRegister,
  isRegistered,
  isRegisteredRecently,
  onRegister,
  isRegistering,
}: {
  assetId?: string;
  canRegister: boolean;
  isRegistered: boolean;
  isRegisteredRecently: boolean;
  onRegister: (assetId: string) => void;
  isRegistering: boolean;
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
}: {
  isRegistered: boolean;
  isRegisteredRecently: boolean;
  canRegister: boolean;
  onRegister: () => void;
  isRegistering: boolean;
}) {
  return (
    <Step>
      <div className="flex flex-col items-center justify-center gap-2">
        {isRegistering ? (
          <>
            <Loader2 className="text-muted-foreground size-16 animate-spin" />
            <h2 className="text-lg font-semibold">Registering tag to asset...</h2>
          </>
        ) : isRegistered ? (
          <>
            <SuccessCircle />
            <h2 className="text-lg font-semibold">
              This tag is {isRegisteredRecently ? "now" : "already"} registered to an asset.
            </h2>
            <Button asChild>
              <Link to="/inspect">Begin Inspection</Link>
            </Button>
          </>
        ) : (
          <>
            <CircleSlash className="text-destructive size-16" />
            <h2 className="text-lg font-semibold">This tag is not registered to an asset.</h2>
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
          </>
        )}
      </div>
    </Step>
  );
}

StepInitial.StepId = "initial";
