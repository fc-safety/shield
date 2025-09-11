import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { create } from "zustand";

interface StepsState {
  stepId: string;
  stepTo: (stepId: string, direction?: "forward" | "backward" | "none") => void;
  stepDirection: "forward" | "backward" | "none";
  reset: (state?: Partial<StepsState>) => void;
}

const initialStepsState = {
  stepDirection: "none",
} as const;

const createUseSteps = (options: { firstStepId: string; onReset?: () => void }) => {
  const initialState = {
    ...initialStepsState,
    stepId: options.firstStepId,
  };

  return create<StepsState>((set, get) => ({
    ...initialState,
    stepTo: (stepId: string, direction: "forward" | "backward" | "none" = "forward") =>
      set({ stepId, stepDirection: direction }),
    reset: (state?: Partial<StepsState>) => {
      set({ ...initialState, ...state });
      options.onReset?.();
    },
  }));
};

export interface AssistantStateContext extends StepsState {
  onClose?: () => void;
}

const AssistantStateContext = createContext<AssistantStateContext>({
  stepId: "",
  stepTo: () => {},
  reset: () => {},
  ...initialStepsState,
});

export const useAssistant = ({
  onClose,
  firstStepId,
  onReset,
}: {
  onClose?: () => void;
  firstStepId: string;
  onReset?: () => void;
}): AssistantStateContext => {
  const useSteps = useRef(
    createUseSteps({
      firstStepId,
      onReset,
    })
  ).current;
  const { stepId, stepTo, stepDirection, reset } = useSteps();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    onClose,
    stepId,
    stepTo,
    stepDirection,
    reset,
  };
};

export const useAssistantContext = () => {
  return useContext(AssistantStateContext) as AssistantStateContext;
};

export default function AssistantProvider({
  context,
  renderStep,
}: {
  context: AssistantStateContext;
  renderStep: (context: AssistantStateContext) => React.ReactNode;
}) {
  return (
    <AssistantStateContext.Provider value={context}>
      <div className="flex h-full w-full flex-col items-center">
        <CurrentStep renderStep={renderStep} context={context} />
      </div>
    </AssistantStateContext.Provider>
  );
}

function CurrentStep({
  renderStep,
  context,
}: {
  renderStep: (context: AssistantStateContext) => React.ReactNode;
  context: AssistantStateContext;
}) {
  const { stepId, stepDirection } = context;

  const step = useMemo(() => {
    return renderStep(context);
  }, [renderStep, context]);

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
          {/* <ScrollArea className="h-full w-full" disableDisplayTable>
            {step}
          </ScrollArea> */}
          {step}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
