import { useCallback, useEffect, useRef, useState } from "react";
import { useImmer } from "use-immer";
import { useCreateAssetAssistant } from "~/components/assets/create-asset-assistant/create-asset-assistant.component";
import AssistantProvider, { useAssistant } from "~/components/assistant/assistant.component";
import type { Asset } from "~/lib/models";
import StepBulkProgramExport from "./steps/bulk-program-export";
import StepBulkProgramPart1 from "./steps/bulk-program-part-1";
import StepBulkProgramPart2 from "./steps/bulk-program-part-2";
import StepBulkSerialNumberInput from "./steps/bulk-serial-number-input";
import StepPreprocessBatchFile from "./steps/preprocess-batch-file";
import StepSelectClient from "./steps/select-client";
import StepSelectMode from "./steps/select-mode";
import StepSelectOwnership from "./steps/select-ownership";
import StepSingleProgram from "./steps/single-program";
import StepSingleRegisterPreselectedAsset from "./steps/single-register-preselected-asset";
import StepSingleSerialNumberInput from "./steps/single-serial-number-input";
import StepUploadBatchFile from "./steps/upload-batch-file";
import type { Mode } from "./types/core";

interface TagAssistantState {
  mode: Mode;
  serialNumberMethod: "sequential" | "manual";
  serialNumberRangeStart?: string;
  serialNumberRangeEnd?: string;
  serialNumbers?: string[];

  // Tag registration
  currentTagUrl?: string;
  clientId?: string;
  siteId?: string;
  assetId?: string;
  registrationCompleted: boolean;

  // Batch file mode
  batchFile?: File;
  selectedClientId?: string;
}

export function TagAssistant({
  assetToRegister,
  onClose,
}: {
  assetToRegister?: Pick<Asset, "id" | "siteId" | "clientId">;
  onClose?: () => void;
}) {
  const [isStepAnimating, setIsStepAnimating] = useState(false);

  const INITIAL_STATE = useRef({
    mode: assetToRegister ? "register-to-asset" : "preprogram-single",
    serialNumberMethod: "sequential",
    registrationCompleted: false,
  } as const).current;

  const [tagAssistantState, setTagAssistantState] = useImmer<TagAssistantState>(INITIAL_STATE);

  const assistant = useAssistant({
    onClose,
    firstStepId: assetToRegister ? StepSingleSerialNumberInput.StepId : StepSelectMode.StepId,
    onReset: () => {
      setTagAssistantState(INITIAL_STATE);
    },
  });

  const { stepTo } = assistant;

  const isCreatingAsset = useRef(false);
  const {
    renderStep: renderCreateAssetAssistantStep,
    firstStepId: createAssetFirstStepId,
    lastStepId: createAssetLastStepId,
    context: { reset: resetCreateAssetAssistant },
  } = useCreateAssetAssistant({
    onClose,
    onStepBackward: () => stepTo(StepSelectOwnership.StepId, "backward"),
    onContinue: (data) => {
      setTagAssistantState((draft) => {
        draft.assetId = data.id;
      });
      stepTo(StepSingleRegisterPreselectedAsset.StepId, "forward");
    },
    continueLabel: "Register",
    state: {
      assetData: {
        siteId: tagAssistantState.siteId,
        clientId: tagAssistantState.clientId,
      },
    },
    mode: "register-tag",
  });

  const registerToAssetMode = tagAssistantState.mode === "register-to-asset";

  useEffect(() => {
    if (assetToRegister) {
      setTagAssistantState((draft) => {
        draft.assetId = assetToRegister.id;
        draft.siteId = assetToRegister.siteId;
        draft.clientId = assetToRegister.clientId;
      });
    }
  }, [assetToRegister]);

  const onBulkProgramRestart = useCallback(() => {
    stepTo(StepBulkSerialNumberInput.StepId, "backward");
    setTagAssistantState((draft) => {
      // Leave the method as is, assuming the user will
      // want to continue with the same method.
      // draft.serialNumberMethod = "sequential";

      // Reset serial number range and list.
      draft.serialNumberRangeStart = undefined;
      draft.serialNumberRangeEnd = undefined;
      draft.serialNumbers = undefined;
    });
  }, [stepTo]);

  return (
    <AssistantProvider
      context={assistant}
      onStepAnimationComplete={() => setIsStepAnimating(false)}
      onStepAnimationStart={() => setIsStepAnimating(true)}
      renderStep={(context) => {
        const { stepId, stepTo } = context;
        switch (stepId) {
          case StepSelectMode.StepId:
            return (
              <StepSelectMode
                onSelectMode={(mode) => {
                  setTagAssistantState((draft) => {
                    draft.mode = mode;
                  });
                  stepTo(
                    mode === "preprogram-single"
                      ? StepSingleSerialNumberInput.StepId
                      : mode === "preprogram-batch"
                        ? StepBulkSerialNumberInput.StepId
                        : StepSelectClient.StepId,
                    "forward"
                  );
                }}
              />
            );
          case StepSingleSerialNumberInput.StepId:
            return (
              <StepSingleSerialNumberInput
                onStepBackward={() => stepTo(StepSelectMode.StepId, "backward")}
                onContinue={() => stepTo(StepSingleProgram.StepId, "forward")}
                serialNumber={tagAssistantState.serialNumberRangeStart}
                setSerialNumber={(serialNumber) => {
                  setTagAssistantState((draft) => {
                    draft.serialNumberRangeStart = serialNumber;
                  });
                }}
                registerToAssetMode={tagAssistantState.mode === "register-to-asset"}
                isStepAnimating={isStepAnimating}
              />
            );
          case StepSingleProgram.StepId:
            return (
              <StepSingleProgram
                serialNumber={tagAssistantState.serialNumberRangeStart ?? ""}
                onStepBackward={() => stepTo(StepSingleSerialNumberInput.StepId, "backward")}
                onRestart={() => {
                  stepTo(StepSingleSerialNumberInput.StepId, "backward");
                  setTagAssistantState((draft) => {
                    draft.serialNumberRangeStart = undefined;
                  });
                }}
                onRegisterTag={(tagUrl: string) => {
                  if (registerToAssetMode) {
                    stepTo(StepSingleRegisterPreselectedAsset.StepId, "forward");
                  } else {
                    stepTo(StepSelectOwnership.StepId, "forward");
                  }
                  setTagAssistantState((draft) => {
                    draft.currentTagUrl = tagUrl;
                  });
                }}
                registerToAssetMode={registerToAssetMode}
              />
            );
          case StepSelectOwnership.StepId:
            return (
              <StepSelectOwnership
                onStepBackward={() => stepTo(StepSingleProgram.StepId, "backward")}
                onContinue={() => {
                  isCreatingAsset.current = true;
                  stepTo(createAssetFirstStepId, "forward");
                }}
                clientId={tagAssistantState.clientId}
                siteId={tagAssistantState.siteId}
                setClientId={(clientId) => {
                  setTagAssistantState((draft) => {
                    draft.clientId = clientId;
                  });
                }}
                setSiteId={(siteId) => {
                  setTagAssistantState((draft) => {
                    draft.siteId = siteId;
                  });
                }}
              />
            );
          case StepSingleRegisterPreselectedAsset.StepId:
            return (
              <StepSingleRegisterPreselectedAsset
                tagUrl={tagAssistantState.currentTagUrl ?? ""}
                onStepBackward={() => {
                  if (isCreatingAsset.current) {
                    stepTo(createAssetLastStepId, "backward");
                  } else {
                    stepTo(StepSingleProgram.StepId, "backward");
                  }
                }}
                onClose={onClose}
                clientId={tagAssistantState.clientId ?? ""}
                siteId={tagAssistantState.siteId ?? ""}
                assetId={tagAssistantState.assetId ?? ""}
                isRegistrationCompleted={tagAssistantState.registrationCompleted}
                onRegistrationCompleted={() => {
                  setTagAssistantState((draft) => {
                    draft.registrationCompleted = true;
                  });
                }}
                onRestart={
                  registerToAssetMode
                    ? undefined
                    : () => {
                        resetCreateAssetAssistant();
                        setTagAssistantState((draft) => {
                          draft.registrationCompleted = false;
                          draft.serialNumberRangeStart = undefined;
                          draft.serialNumberRangeEnd = undefined;
                          draft.serialNumbers = undefined;
                          draft.currentTagUrl = undefined;
                        });
                        stepTo(StepSingleSerialNumberInput.StepId, "backward");
                      }
                }
              />
            );
          case StepBulkSerialNumberInput.StepId:
            return (
              <StepBulkSerialNumberInput
                onStepBackward={() => stepTo(StepSelectMode.StepId, "backward")}
                onContinue={() => stepTo(StepBulkProgramPart1.StepId, "forward")}
                serialNumberMethod={tagAssistantState.serialNumberMethod}
                setSerialNumberMethod={(serialNumberMethod) => {
                  setTagAssistantState((draft) => {
                    draft.serialNumberMethod = serialNumberMethod;
                  });
                }}
                serialNumberRangeStart={tagAssistantState.serialNumberRangeStart}
                setSerialNumberRangeStart={(serialNumberRangeStart) => {
                  setTagAssistantState((draft) => {
                    draft.serialNumberRangeStart = serialNumberRangeStart;
                  });
                }}
                serialNumberRangeEnd={tagAssistantState.serialNumberRangeEnd}
                setSerialNumberRangeEnd={(serialNumberRangeEnd) => {
                  setTagAssistantState((draft) => {
                    draft.serialNumberRangeEnd = serialNumberRangeEnd;
                  });
                }}
                serialNumbers={tagAssistantState.serialNumbers}
                setSerialNumbers={(serialNumbers) => {
                  setTagAssistantState((draft) => {
                    draft.serialNumbers = serialNumbers;
                  });
                }}
              />
            );
          case StepBulkProgramPart1.StepId:
            return (
              <StepBulkProgramPart1
                onStepBackward={() => stepTo(StepBulkSerialNumberInput.StepId, "backward")}
                onExport={() => stepTo(StepBulkProgramExport.StepId, "forward")}
                onProgramNow={() => stepTo(StepBulkProgramPart2.StepId, "forward")}
                serialNumberMethod={tagAssistantState.serialNumberMethod}
                serialNumberRangeStart={tagAssistantState.serialNumberRangeStart}
                serialNumberRangeEnd={tagAssistantState.serialNumberRangeEnd}
                serialNumbers={tagAssistantState.serialNumbers}
              />
            );
          case StepBulkProgramExport.StepId:
            return (
              <StepBulkProgramExport
                onRestart={onBulkProgramRestart}
                onStepBackward={() => stepTo(StepBulkProgramPart1.StepId, "backward")}
                serialNumberMethod={tagAssistantState.serialNumberMethod}
                serialNumberRangeStart={tagAssistantState.serialNumberRangeStart}
                serialNumberRangeEnd={tagAssistantState.serialNumberRangeEnd}
                serialNumbers={tagAssistantState.serialNumbers}
              />
            );
          case StepBulkProgramPart2.StepId:
            return (
              <StepBulkProgramPart2
                onRestart={onBulkProgramRestart}
                onStepBackward={() => stepTo(StepBulkProgramPart1.StepId, "backward")}
                serialNumberMethod={tagAssistantState.serialNumberMethod}
                serialNumberRangeStart={tagAssistantState.serialNumberRangeStart}
                serialNumberRangeEnd={tagAssistantState.serialNumberRangeEnd}
                serialNumbers={tagAssistantState.serialNumbers}
              />
            );
          case StepSelectClient.StepId:
            return (
              <StepSelectClient
                onContinue={() => stepTo(StepUploadBatchFile.StepId, "forward")}
                onStepBackward={() => stepTo(StepSelectMode.StepId, "backward")}
                selectedClientId={tagAssistantState.selectedClientId}
                onSelectClient={(clientId) => {
                  setTagAssistantState((draft) => {
                    draft.selectedClientId = clientId;
                  });
                }}
              />
            );
          case StepUploadBatchFile.StepId:
            return (
              <StepUploadBatchFile
                onContinue={() => stepTo(StepPreprocessBatchFile.StepId, "forward")}
                onStepBackward={() => stepTo(StepSelectClient.StepId, "backward")}
                selectedFile={tagAssistantState.batchFile}
                onSelectFile={(file) => {
                  setTagAssistantState((draft) => {
                    draft.batchFile = file;
                  });
                }}
              />
            );
          case StepPreprocessBatchFile.StepId:
            return (
              <StepPreprocessBatchFile
                onStepBackward={() => stepTo(StepUploadBatchFile.StepId, "backward")}
                batchFile={tagAssistantState.batchFile}
              />
            );
          default:
            return renderCreateAssetAssistantStep(context);
        }
      }}
    />
  );
}
