import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { cn } from "~/lib/utils";

export default function SuccessCircle({ className }: { className?: string }) {
  return (
    <MotionCheckCircle
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
      }}
      className={cn("text-primary size-16", className)}
    />
  );
}

const MotionCheckCircle = motion(CheckCircle);
