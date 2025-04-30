import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function SuccessCircle() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
      }}
    >
      <CheckCircle className="size-16 text-primary" />
    </motion.div>
  );
}
