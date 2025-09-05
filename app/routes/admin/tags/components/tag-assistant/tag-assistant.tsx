import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useImmer, type Updater } from "use-immer";
import { create } from "zustand";
import type { Asset } from "~/lib/models";
import StepBulkProgramExport from "./steps/bulk-program-export";
import StepBulkProgramPart1 from "./steps/bulk-program-part-1";
import StepBulkProgramPart2 from "./steps/bulk-program-part-2";
import StepBulkSerialNumberInput from "./steps/bulk-serial-number-input";
import StepPreprocessBatchFile from "./steps/preprocess-batch-file";
import StepSelectClient from "./steps/select-client";
import StepSelectMode from "./steps/select-mode";
import StepSingleProgram from "./steps/single-program";
import StepSingleRegister from "./steps/single-register";
import StepSingleSerialNumberInput from "./steps/single-serial-number-input";
import StepUploadBatchFile from "./steps/upload-batch-file";
import type { Mode } from "./types/core";

interface StepsState {
  stepId: string;
  stepTo: (stepId: string, direction?: "forward" | "backward" | "none") => void;
  stepDirection: "forward" | "backward" | "none";
  reset: (state?: Partial<StepsState>) => void;
}

interface AssistantState {
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

const initialStepsState = {
  stepDirection: "none",
} as const;

const createUseSteps = (options: { firstStepId: string }) => {
  const initialState = {
    ...initialStepsState,
    stepId: options.firstStepId,
  };

  return create<StepsState>((set, get) => ({
    ...initialState,
    stepTo: (stepId: string, direction: "forward" | "backward" | "none" = "forward") =>
      set({ stepId, stepDirection: direction }),
    reset: (state?: Partial<StepsState>) => set({ ...initialState, ...state }),
  }));
};

export default function TagAssistant({
  assetToRegister,
  onClose,
}: {
  assetToRegister?: Pick<Asset, "id" | "siteId" | "clientId">;
  onClose?: () => void;
}) {
  const useSteps = useRef(
    createUseSteps({
      firstStepId: assetToRegister ? StepSingleSerialNumberInput.StepId : StepSelectMode.StepId,
    })
  ).current;
  const { stepId, stepTo, stepDirection, reset: resetSteps } = useSteps();

  useEffect(() => {
    return () => {
      resetSteps();
    };
  }, [resetSteps]);

  const [assistantState, setAssistantState] = useImmer<AssistantState>({
    mode: assetToRegister ? "register-to-asset" : "preprogram-single",
    serialNumberMethod: "sequential",
    registrationCompleted: false,
  });

  useEffect(() => {
    if (assetToRegister) {
      setAssistantState((draft) => {
        draft.assetId = assetToRegister.id;
        draft.siteId = assetToRegister.siteId;
        draft.clientId = assetToRegister.clientId;
      });
    }
  }, [assetToRegister]);

  return (
    <div className="flex h-full w-full flex-col items-center">
      <CurrentStep
        onClose={onClose}
        stepId={stepId}
        stepTo={stepTo}
        stepDirection={stepDirection}
        assistantState={assistantState}
        setAssistantState={setAssistantState}
      />
    </div>
  );
}

const CurrentStep = ({
  onClose,
  stepId,
  stepTo,
  stepDirection,
  assistantState,
  setAssistantState,
}: {
  onClose?: () => void;
  stepId: StepsState["stepId"];
  stepTo: StepsState["stepTo"];
  stepDirection: StepsState["stepDirection"];
  assistantState: AssistantState;
  setAssistantState: Updater<AssistantState>;
}) => {
  const onBulkProgramRestart = useCallback(() => {
    stepTo(StepBulkSerialNumberInput.StepId, "backward");
    setAssistantState((draft) => {
      // Leave the method as is, assuming the user will
      // want to continue with the same method.
      // draft.serialNumberMethod = "sequential";

      // Reset serial number range and list.
      draft.serialNumberRangeStart = undefined;
      draft.serialNumberRangeEnd = undefined;
      draft.serialNumbers = undefined;
    });
  }, []);

  const step = useMemo(() => {
    switch (stepId) {
      case StepSelectMode.StepId:
        return (
          <StepSelectMode
            onSelectMode={(mode) => {
              setAssistantState((draft) => {
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
            serialNumber={assistantState.serialNumberRangeStart}
            setSerialNumber={(serialNumber) => {
              setAssistantState((draft) => {
                draft.serialNumberRangeStart = serialNumber;
              });
            }}
            registerToAssetMode={assistantState.mode === "register-to-asset"}
          />
        );
      case StepSingleProgram.StepId:
        return (
          <StepSingleProgram
            serialNumber={assistantState.serialNumberRangeStart ?? ""}
            onStepBackward={() => stepTo(StepSingleSerialNumberInput.StepId, "backward")}
            onRestart={() => {
              stepTo(StepSingleSerialNumberInput.StepId, "backward");
              setAssistantState((draft) => {
                draft.serialNumberRangeStart = undefined;
              });
            }}
            onRegisterTag={(tagUrl: string) => {
              stepTo(StepSingleRegister.StepId, "forward");
              setAssistantState((draft) => {
                draft.currentTagUrl = tagUrl;
              });
            }}
            registerToAssetMode={assistantState.mode === "register-to-asset"}
          />
        );
      case StepSingleRegister.StepId:
        return (
          <StepSingleRegister
            tagUrl={assistantState.currentTagUrl ?? ""}
            onStepBackward={() => stepTo(StepSingleProgram.StepId, "backward")}
            onRestart={() => {
              stepTo(StepSingleSerialNumberInput.StepId, "backward");
              setAssistantState((draft) => {
                draft.serialNumberRangeStart = undefined;
                draft.assetId = undefined;
                draft.registrationCompleted = false;
              });
            }}
            onClose={onClose}
            clientId={assistantState.clientId}
            siteId={assistantState.siteId}
            assetId={assistantState.assetId}
            setClientId={(clientId) => {
              setAssistantState((draft) => {
                draft.clientId = clientId;
              });
            }}
            setSiteId={(siteId) => {
              setAssistantState((draft) => {
                draft.siteId = siteId;
              });
            }}
            setAssetId={(assetId) => {
              setAssistantState((draft) => {
                draft.assetId = assetId;
              });
            }}
            isRegistrationCompleted={assistantState.registrationCompleted}
            onRegistrationCompleted={() => {
              setAssistantState((draft) => {
                draft.registrationCompleted = true;
              });
            }}
            registerToAssetMode={assistantState.mode === "register-to-asset"}
          />
        );
      case StepBulkSerialNumberInput.StepId:
        return (
          <StepBulkSerialNumberInput
            onStepBackward={() => stepTo(StepSelectMode.StepId, "backward")}
            onContinue={() => stepTo(StepBulkProgramPart1.StepId, "forward")}
            serialNumberMethod={assistantState.serialNumberMethod}
            setSerialNumberMethod={(serialNumberMethod) => {
              setAssistantState((draft) => {
                draft.serialNumberMethod = serialNumberMethod;
              });
            }}
            serialNumberRangeStart={assistantState.serialNumberRangeStart}
            setSerialNumberRangeStart={(serialNumberRangeStart) => {
              setAssistantState((draft) => {
                draft.serialNumberRangeStart = serialNumberRangeStart;
              });
            }}
            serialNumberRangeEnd={assistantState.serialNumberRangeEnd}
            setSerialNumberRangeEnd={(serialNumberRangeEnd) => {
              setAssistantState((draft) => {
                draft.serialNumberRangeEnd = serialNumberRangeEnd;
              });
            }}
            serialNumbers={assistantState.serialNumbers}
            setSerialNumbers={(serialNumbers) => {
              setAssistantState((draft) => {
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
            serialNumberMethod={assistantState.serialNumberMethod}
            serialNumberRangeStart={assistantState.serialNumberRangeStart}
            serialNumberRangeEnd={assistantState.serialNumberRangeEnd}
            serialNumbers={assistantState.serialNumbers}
          />
        );
      case StepBulkProgramExport.StepId:
        return (
          <StepBulkProgramExport
            onRestart={onBulkProgramRestart}
            onStepBackward={() => stepTo(StepBulkProgramPart1.StepId, "backward")}
            serialNumberMethod={assistantState.serialNumberMethod}
            serialNumberRangeStart={assistantState.serialNumberRangeStart}
            serialNumberRangeEnd={assistantState.serialNumberRangeEnd}
            serialNumbers={assistantState.serialNumbers}
          />
        );
      case StepBulkProgramPart2.StepId:
        return (
          <StepBulkProgramPart2
            onRestart={onBulkProgramRestart}
            onStepBackward={() => stepTo(StepBulkProgramPart1.StepId, "backward")}
            serialNumberMethod={assistantState.serialNumberMethod}
            serialNumberRangeStart={assistantState.serialNumberRangeStart}
            serialNumberRangeEnd={assistantState.serialNumberRangeEnd}
            serialNumbers={assistantState.serialNumbers}
          />
        );
      case StepSelectClient.StepId:
        return (
          <StepSelectClient
            onContinue={() => stepTo(StepUploadBatchFile.StepId, "forward")}
            onStepBackward={() => stepTo(StepSelectMode.StepId, "backward")}
            selectedClientId={assistantState.selectedClientId}
            onSelectClient={(clientId) => {
              setAssistantState((draft) => {
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
            selectedFile={assistantState.batchFile}
            onSelectFile={(file) => {
              setAssistantState((draft) => {
                draft.batchFile = file;
              });
            }}
          />
        );
      case StepPreprocessBatchFile.StepId:
        return (
          <StepPreprocessBatchFile
            onStepBackward={() => stepTo(StepUploadBatchFile.StepId, "backward")}
            batchFile={assistantState.batchFile}
          />
        );
      default:
        null;
    }
  }, [stepId, assistantState]);

  return (
    <div className="relative h-full w-full">
      <AnimatePresence custom={stepDirection}>
        <motion.div
          key={stepId}
          className="absolute inset-0 flex flex-col items-center justify-center"
          custom={stepDirection}
          variants={{
            slideIn: (direction: typeof stepDirection) => ({
              opacity: 0,
              translateX:
                direction === "forward" ? "100%" : direction === "backward" ? "-100%" : "0%",
            }),
            slideOut: (direction: typeof stepDirection) => ({
              opacity: 0,
              translateX: direction === "backward" ? "100%" : "-100%",
            }),
          }}
          initial="slideIn"
          animate={{
            opacity: 1,
            translateX: "0%",
          }}
          exit="slideOut"
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 26,
          }}
        >
          {step}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
