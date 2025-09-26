import type { ViewContext } from "~/.server/api-utils";
import { useCreateAssetAssistant } from "~/components/assets/create-asset-assistant/create-asset-assistant.component";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import type { Asset, AssetQuestion } from "~/lib/models";
import StepCompleteAssetSetup from "./components/steps/complete-asset-setup";
import StepInitial from "./components/steps/initial";

export default function RegisterTagAssistant({
  assetId,
  siteId,
  clientId,
  canRegister,
  isRegistered,
  isRegisteredRecently = false,
  onRegister,
  isRegistering,
  setupRequired,
  setupQuestions,
  onClose,
  hideInspectionPrompt = false,
  viewContext = "user",
}: {
  assetId?: string;
  siteId?: string;
  clientId?: string;
  canRegister: boolean;
  isRegistered: boolean;
  isRegisteredRecently?: boolean;
  onRegister: (asset: Asset) => void;
  isRegistering: boolean;
  setupRequired?: boolean;
  setupQuestions?: AssetQuestion[] | null;
  onClose?: () => void;
  hideInspectionPrompt?: boolean;
  viewContext?: ViewContext;
}) {
  const assistant = useAssistant({
    firstStepId: StepInitial.StepId,
  });

  const { stepTo } = assistant;

  const handleRegister = (asset: Asset) => {
    onRegister(asset);
    stepTo(StepInitial.StepId, "forward");
  };

  const { renderStep: renderCreateAssetAssistantStep, firstStepId: createAssetFirstStepId } =
    useCreateAssetAssistant({
      onStepBackward: () => {
        stepTo(StepInitial.StepId, "backward");
      },
      onContinue: (data) => {
        handleRegister(data);
      },
      continueLabel: "Register",
      state: {
        assetData: {
          id: assetId,
          siteId,
          clientId,
        },
      },
      viewContext,
      mode: "register-tag",
      onClose,
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
                hideInspectionPrompt={hideInspectionPrompt}
                onClose={onClose}
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
