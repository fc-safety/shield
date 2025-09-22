import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImmer } from "use-immer";
import type { ViewContext } from "~/.server/api-utils";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import { useAuth } from "~/contexts/auth-context";
import type { Asset } from "~/lib/models";
import { hasMultiSiteVisibility } from "~/lib/users";
import StepSelectOwnership from "~/routes/admin/tags/components/tag-assistant/steps/select-ownership";
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
  mode = "normal",
}: {
  onClose?: () => void;
  initialState?: Partial<CreateAssetAssistantState>;
  state?: Partial<CreateAssetAssistantState>;
  onStepBackward?: () => void;
  onContinue?: (data: Asset) => void;
  viewContext?: ViewContext;
  continueLabel?: string;
  mode?: "normal" | "register-tag";
}) => {
  const [lastStepId, setLastStepId] = useState(DEFAULT_LAST_STEP_ID);

  const { user } = useAuth();
  const userHasMultiSiteVisibility = useMemo(() => hasMultiSiteVisibility(user), [user]);

  const INITIAL_STATE = useRef({
    ...state,
    ...initialState,
  } as const).current;

  const [createAssetAssistantState, setCreateAssetAssistantState] =
    useImmer<CreateAssetAssistantState>(INITIAL_STATE);

  const shouldRequireClientId = useMemo(() => {
    return viewContext === "admin" && INITIAL_STATE.assetData?.clientId === undefined;
  }, [viewContext]);
  const shouldRequireSiteId = useMemo(() => {
    return userHasMultiSiteVisibility && INITIAL_STATE.assetData?.siteId === undefined;
  }, [userHasMultiSiteVisibility]);

  const firstStepId = useMemo(() => {
    if (shouldRequireClientId || shouldRequireSiteId) {
      return StepSelectOwnership.StepId;
    }
    return DEFAULT_FIRST_STEP_ID;
  }, [shouldRequireClientId, shouldRequireSiteId]);

  const assistant = useAssistant({
    onClose,
    firstStepId,
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
        case StepSelectOwnership.StepId:
          return (
            <StepSelectOwnership
              onStepBackward={onStepBackward}
              onContinue={() => context.stepTo(StepSelectCategoryOrExistingAsset.StepId, "forward")}
              clientId={createAssetAssistantState.assetData?.clientId}
              siteId={createAssetAssistantState.assetData?.siteId}
              setClientId={(clientId) =>
                setCreateAssetAssistantState((draft) => {
                  draft.assetData = { ...draft.assetData, clientId };
                })
              }
              setSiteId={(siteId) =>
                setCreateAssetAssistantState((draft) => {
                  draft.assetData = { ...draft.assetData, siteId };
                })
              }
              viewContext={viewContext}
              clientIdInputDisabled={!shouldRequireClientId}
              ownershipObjectName="asset"
            />
          );
        case StepSelectCategoryOrExistingAsset.StepId:
          return (
            <StepSelectCategoryOrExistingAsset
              allowSelectExistingAsset={mode === "register-tag"}
              onStepBackward={
                firstStepId === StepSelectOwnership.StepId
                  ? () => context.stepTo(StepSelectOwnership.StepId, "backward")
                  : onStepBackward
              }
              onContinue={({ skipToSelectExistingAsset }) => {
                if (skipToSelectExistingAsset) {
                  setLastStepId(StepSelectExistingAsset.StepId);
                  context.stepTo(StepSelectExistingAsset.StepId, "forward");
                } else {
                  setLastStepId(StepSelectProduct.StepId);
                  context.stepTo(StepSelectProduct.StepId, "forward");
                }
              }}
              productCategoryId={createAssetAssistantState.productCategoryId}
              setProductCategoryId={(id) =>
                setCreateAssetAssistantState((draft) => {
                  draft.productCategoryId = id;
                })
              }
            />
          );
        case StepSelectExistingAsset.StepId:
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
          return (
            <StepAssetDetailsForm
              onClose={onClose}
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
    firstStepId,
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
