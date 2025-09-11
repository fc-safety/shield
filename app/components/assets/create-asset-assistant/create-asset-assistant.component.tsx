import { useCallback, useEffect, useRef, useState } from "react";
import { useImmer } from "use-immer";
import type { ViewContext } from "~/.server/api-utils";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import type { Asset } from "~/lib/models";
import StepAssetDetailsForm from "./components/steps/asset-details-form";
import StepSelectCategoryOrExistingAsset from "./components/steps/select-category-or-existing-asset";
import StepSelectExistingAsset from "./components/steps/select-existing-asset";
import StepSelectProduct from "./components/steps/select-product";

interface CreateAssetAssistantState {
  productCategoryId?: string;
  assetData?: Partial<Asset>;
}

const DEFAULT_FIRST_STEP_ID = StepSelectCategoryOrExistingAsset.StepId;
const DEFAULT_LAST_STEP_ID = StepAssetDetailsForm.StepId;

export const useCreateAssetAssistant = ({
  onClose,
  initialState,
  state,
  onStepBackward,
  onContinue,
  viewContext,
  continueLabel,
}: {
  onClose?: () => void;
  initialState?: Partial<CreateAssetAssistantState>;
  state?: Partial<CreateAssetAssistantState>;
  onStepBackward?: () => void;
  onContinue?: (data: Asset) => void;
  viewContext?: ViewContext;
  continueLabel?: string;
}) => {
  const [lastStepId, setLastStepId] = useState(DEFAULT_LAST_STEP_ID);

  const INITIAL_STATE = useRef({
    ...state,
    ...initialState,
  } as const).current;

  const [createAssetAssistantState, setCreateAssetAssistantState] =
    useImmer<CreateAssetAssistantState>(INITIAL_STATE);

  const assistant = useAssistant({
    onClose,
    firstStepId: DEFAULT_FIRST_STEP_ID,
    onReset: () => {
      setCreateAssetAssistantState(INITIAL_STATE);
    },
  });

  useEffect(() => {
    if (!state) return;
    setCreateAssetAssistantState((draft) => ({
      ...draft,
      ...state,
    }));
  }, [
    state?.productCategoryId,
    state?.assetData?.clientId,
    state?.assetData?.siteId,
    state?.assetData?.productId,
    state?.assetData?.serialNumber,
    state?.assetData?.name,
    state?.assetData?.location,
    state?.assetData?.placement,
    state?.assetData?.metadata,
    state?.assetData?.legacyAssetId,
    state?.assetData?.inspectionCycle,
    setCreateAssetAssistantState,
  ]);

  const renderStep = useCallback(
    (context: typeof assistant) => {
      switch (context.stepId) {
        case StepSelectCategoryOrExistingAsset.StepId:
          return (
            <StepSelectCategoryOrExistingAsset
              onStepBackward={onStepBackward}
              onContinue={({ skipToSelectExistingAsset }) =>
                context.stepTo(
                  skipToSelectExistingAsset
                    ? StepSelectExistingAsset.StepId
                    : StepSelectProduct.StepId,
                  "forward"
                )
              }
              productCategoryId={createAssetAssistantState.productCategoryId}
              setProductCategoryId={(id) =>
                setCreateAssetAssistantState((draft) => {
                  draft.productCategoryId = id;
                })
              }
            />
          );
        case StepSelectExistingAsset.StepId:
          setLastStepId(StepSelectExistingAsset.StepId);
          return (
            <StepSelectExistingAsset
              onStepBackward={() =>
                context.stepTo(StepSelectCategoryOrExistingAsset.StepId, "backward")
              }
              onContinue={onContinue ?? (() => {})}
              viewContext={viewContext}
              assetId={createAssetAssistantState.assetData?.id}
              setAssetId={(id) =>
                setCreateAssetAssistantState((draft) => {
                  draft.assetData = { ...draft.assetData, id };
                })
              }
              siteId={createAssetAssistantState.assetData?.siteId}
              clientId={createAssetAssistantState.assetData?.clientId}
              continueLabel={continueLabel}
            />
          );
        case StepSelectProduct.StepId:
          return (
            <StepSelectProduct
              onStepBackward={() =>
                context.stepTo(StepSelectCategoryOrExistingAsset.StepId, "backward")
              }
              onContinue={() => {
                context.stepTo(StepAssetDetailsForm.StepId, "forward");
              }}
              productCategoryId={createAssetAssistantState.productCategoryId}
              productId={createAssetAssistantState.assetData?.productId}
              setProductId={(id) =>
                setCreateAssetAssistantState((draft) => {
                  if (!draft.assetData) {
                    draft.assetData = {};
                  }
                  draft.assetData.productId = id;
                })
              }
            />
          );
        case StepAssetDetailsForm.StepId:
          setLastStepId(StepAssetDetailsForm.StepId);
          return (
            <StepAssetDetailsForm
              onStepBackward={() => context.stepTo(StepSelectProduct.StepId, "backward")}
              onContinue={onContinue}
              assetData={createAssetAssistantState.assetData}
              setAssetData={(data) =>
                setCreateAssetAssistantState((draft) => {
                  draft.assetData = data;
                })
              }
              viewContext={viewContext}
              continueLabel={continueLabel}
            />
          );
        default:
          return null;
      }
    },
    [createAssetAssistantState]
  );

  return {
    context: assistant,
    renderStep,
    firstStepId: DEFAULT_FIRST_STEP_ID,
    lastStepId,
  };
};

export default function CreateAssetAssistant({
  ...props
}: Parameters<typeof useCreateAssetAssistant>[0]) {
  const { context, renderStep } = useCreateAssetAssistant({
    ...props,
  });

  return <AssistantProvider context={context} renderStep={renderStep} />;
}
