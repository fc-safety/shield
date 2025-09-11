import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { type AssistantStateContext } from "./assistant.component";

export default function CurrentStep({
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
          {step}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
