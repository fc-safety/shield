import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImmer } from "use-immer";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import { useAuth } from "~/contexts/auth-context";
import { useViewContext } from "~/contexts/view-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import type { Asset } from "~/lib/models";
import { getAssetQuestionsByAssetPropertiesQueryOptions } from "~/lib/services/assets.service";
import { hasMultiSiteVisibility } from "~/lib/users";
import StepSelectOwnership from "~/routes/admin/tags/components/tag-assistant/steps/select-ownership";
import StepAssetDetailsForm from "./components/steps/asset-details-form";
import StepConfigureAsset from "./components/steps/configure-asset";
import StepSelectCategoryOrExistingAsset from "./components/steps/select-category-or-existing-asset";
import StepSelectExistingAsset from "./components/steps/select-existing-asset";
import StepSelectProduct from "./components/steps/select-product";

interface CreateAssetAssistantState {
  productCategoryId?: string;
  assetData?: Partial<Asset>;
  asset?: Asset;
}

const DEFAULT_FIRST_STEP_ID = StepSelectCategoryOrExistingAsset.StepId;
const DEFAULT_LAST_STEP_ID = StepAssetDetailsForm.StepId;

export const useCreateAssetAssistant = ({
  onClose,
  initialState,
  state,
  onStepBackward,
  onContinue,
  continueLabel,
  mode = "normal",
}: {
  onClose?: () => void;
  initialState?: Partial<CreateAssetAssistantState>;
  state?: Partial<CreateAssetAssistantState>;
  onStepBackward?: () => void;
  onContinue?: (data: Asset) => void;
  continueLabel?: string;
  mode?: "normal" | "register-tag";
}) => {
  const [lastStepId, setLastStepId] = useState(DEFAULT_LAST_STEP_ID);

  const viewContext = useViewContext();

  const { user } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const userHasMultiSiteVisibility = useMemo(() => hasMultiSiteVisibility(user), [user]);

  // Keep refs to latest initialState and state to avoid stale closures in onReset
  const initialStateRef = useRef(initialState);
  const stateRef = useRef(state);
  useEffect(() => {
    initialStateRef.current = initialState;
    stateRef.current = state;
  }, [initialState, state]);

  // Keep stable reference to initial state that only changes when the assistant is reset.
  // This is used to maintain a non-stale version of the initial state for use by the combined
  // state below (called `externalState`).
  const [initialExternalState, setInitialExternalState] = useState({
    ...initialState,
    ...state,
  } as const);
  // Keep an unstable reference to the state that updates whenever the upstream props change.
  const externalState = useMemo(
    () =>
      ({
        ...initialExternalState,
        ...state,
      }) as const,
    [initialExternalState, state]
  );

  const [createAssetAssistantState, setCreateAssetAssistantState] =
    useImmer<CreateAssetAssistantState>(initialExternalState);

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

  const shouldRequireClientId = useMemo(() => {
    return viewContext === "admin" && !externalState.assetData?.clientId;
  }, [viewContext, externalState.assetData?.clientId]);
  const shouldRequireSiteId = useMemo(() => {
    return userHasMultiSiteVisibility && !externalState.assetData?.siteId;
  }, [userHasMultiSiteVisibility, externalState.assetData?.siteId]);

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
      const newInitialExternalState = {
        ...initialStateRef.current,
        ...stateRef.current,
      } as const;
      setInitialExternalState(newInitialExternalState);
      setCreateAssetAssistantState(newInitialExternalState);
    },
  });

  const { data: assetConfigurationQuestions } = useQuery({
    ...getAssetQuestionsByAssetPropertiesQueryOptions(fetchOrThrow, {
      type: "CONFIGURATION",
      siteId: createAssetAssistantState.assetData?.siteId ?? "",
      productId: createAssetAssistantState.assetData?.productId ?? "",
    }),
    enabled:
      !!createAssetAssistantState.assetData &&
      !createAssetAssistantState.assetData.configured &&
      !!createAssetAssistantState.assetData.siteId &&
      !!createAssetAssistantState.assetData.productId,
  });
  const shouldConfigure = assetConfigurationQuestions && assetConfigurationQuestions.length > 0;

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
              clientIdInputDisabled={!shouldRequireClientId}
              ownershipObjectName="asset"
            />
          );
        case StepSelectCategoryOrExistingAsset.StepId:
          return (
            <StepSelectCategoryOrExistingAsset
              clientId={createAssetAssistantState.assetData?.clientId}
              viewContext={viewContext}
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
              clientId={createAssetAssistantState.assetData?.clientId}
              viewContext={viewContext}
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
              onContinue={
                shouldConfigure
                  ? (asset) => {
                      setCreateAssetAssistantState((draft) => {
                        draft.asset = asset;
                      });
                      context.stepTo(StepConfigureAsset.StepId, "forward");
                    }
                  : onContinue
              }
              assetData={createAssetAssistantState.assetData}
              setAssetData={(data) =>
                setCreateAssetAssistantState((draft) => {
                  draft.assetData = data;
                })
              }
              continueLabel={shouldConfigure ? "Configure" : continueLabel}
            />
          );
        case StepConfigureAsset.StepId:
          return (
            <StepConfigureAsset
              assetId={createAssetAssistantState.asset?.id ?? ""}
              questions={assetConfigurationQuestions ?? []}
              onStepBackward={() => context.stepTo(StepAssetDetailsForm.StepId, "backward")}
              onContinue={
                onContinue && createAssetAssistantState.asset
                  ? () =>
                      createAssetAssistantState.asset &&
                      onContinue?.(createAssetAssistantState.asset)
                  : undefined
              }
              continueLabel={continueLabel}
              onClose={onClose}
            />
          );
        default:
          return null;
      }
    },
    [createAssetAssistantState, shouldConfigure, assetConfigurationQuestions]
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
