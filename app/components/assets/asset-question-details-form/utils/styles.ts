import { cva } from "class-variance-authority";

export const alertTriggerVariants = cva("", {
  variants: {
    alertLevel: {
      CRITICAL: "bg-critical text-critical-foreground border-critical",
      URGENT: "bg-urgent text-urgent-foreground border-urgent",
      WARNING: "bg-warning text-warning-foreground border-warning-foreground",
      INFO: "bg-info text-info-foreground border-info-foreground",
      AUDIT: "bg-audit text-audit-foreground border-audit-foreground",
    },
  },
});
