import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo } from "react";
import { useImmer, type Updater } from "use-immer";
import { create } from "zustand";
import StepBulkProgramExport from "./steps/bulk-program-export";
import StepBulkProgramPart1 from "./steps/bulk-program-part-1";
import StepBulkProgramPart2 from "./steps/bulk-program-part-2";
import StepBulkSerialNumberInput from "./steps/bulk-serial-number-input";
import StepSelectMode from "./steps/select-mode";
import StepSingleProgram from "./steps/single-program";
import StepSingleSerialNumberInput from "./steps/single-serial-number-input";

// const useSteps = createUseSteps({ maxStep: 3 });

interface StepsState {
  stepId: string;
  stepTo: (stepId: string, direction?: "forward" | "backward") => void;
  stepDirection: "forward" | "backward" | "none";
  reset: () => void;
}

interface AssistantState {
  mode: "single" | "bulk";
  serialNumberMethod: "sequential" | "manual";
  serialNumberRangeStart?: string;
  serialNumberRangeEnd?: string;
  serialNumbers?: string[];
}

const initialStepsState = {
  stepId: "select-mode",
  stepDirection: "none",
} as const;

const createUseSteps = (options: { firstStepId: string }) => {
  return create<StepsState>((set, get) => ({
    ...initialStepsState,
    stepTo: (stepId: string, direction: "forward" | "backward" = "forward") =>
      set({ stepId, stepDirection: direction }),
    reset: () => set(initialStepsState),
  }));
};

const useSteps = createUseSteps({ firstStepId: "select-mode" });

export default function TagAssistant() {
  const { stepId, stepTo, stepDirection, reset: resetSteps } = useSteps();

  useEffect(() => {
    return () => {
      resetSteps();
    };
  }, [resetSteps]);

  const [assistantState, setAssistantState] = useImmer<AssistantState>({
    mode: "single",
    serialNumberMethod: "sequential",
  });

  return (
    <div className="h-full w-full flex flex-col items-center">
      <CurrentStep
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
  stepId,
  stepTo,
  stepDirection,
  assistantState,
  setAssistantState,
}: {
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
                mode === "single"
                  ? StepSingleSerialNumberInput.StepId
                  : StepBulkSerialNumberInput.StepId,
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
          />
        );
      case StepSingleProgram.StepId:
        return (
          <StepSingleProgram
            serialNumber={assistantState.serialNumberRangeStart ?? ""}
            onStepBackward={() =>
              stepTo(StepSingleSerialNumberInput.StepId, "backward")
            }
            onRestart={() => {
              stepTo(StepSingleSerialNumberInput.StepId, "backward");
              setAssistantState((draft) => {
                draft.serialNumberRangeStart = undefined;
              });
            }}
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
            onStepBackward={() =>
              stepTo(StepBulkSerialNumberInput.StepId, "backward")
            }
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
            onStepBackward={() =>
              stepTo(StepBulkProgramPart1.StepId, "backward")
            }
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
            onStepBackward={() =>
              stepTo(StepBulkProgramPart1.StepId, "backward")
            }
            serialNumberMethod={assistantState.serialNumberMethod}
            serialNumberRangeStart={assistantState.serialNumberRangeStart}
            serialNumberRangeEnd={assistantState.serialNumberRangeEnd}
            serialNumbers={assistantState.serialNumbers}
          />
        );
      default:
        null;
    }
  }, [stepId, assistantState]);

  return (
    <div className="h-full w-full relative">
      <AnimatePresence custom={stepDirection}>
        <motion.div
          key={stepId}
          className="absolute inset-0 flex flex-col items-center justify-center"
          custom={stepDirection}
          variants={{
            slideIn: (direction: typeof stepDirection) => ({
              opacity: 0,
              translateX:
                direction === "forward"
                  ? "100%"
                  : direction === "backward"
                  ? "-100%"
                  : "0%",
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
