import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { AssetQuestionCondition } from "~/lib/models";
import { cn } from "~/lib/utils";

const conditionTypeVariants = cva("", {
  variants: {
    type: {
      REGION: "bg-blue-500 text-white dark:bg-blue-400 dark:text-blue-950",
      MANUFACTURER: "bg-purple-500 text-white dark:bg-purple-400 dark:text-purple-950",
      PRODUCT_CATEGORY: "bg-green-500 text-white dark:bg-green-400 dark:text-green-950",
      PRODUCT_SUBCATEGORY: "bg-teal-500 text-white dark:bg-teal-400 dark:text-teal-950",
      PRODUCT: "bg-orange-500 text-white dark:bg-orange-400 dark:text-orange-950",
    },
  },
});

interface ConditionPillProps {
  condition: AssetQuestionCondition;
  label?: string;
  isLoading?: boolean;
}

export default function ConditionPill({ condition, label, isLoading = false }: ConditionPillProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "REGION":
        return "Region";
      case "MANUFACTURER":
        return "Manufacturer";
      case "PRODUCT_CATEGORY":
        return "Category";
      case "PRODUCT_SUBCATEGORY":
        return "Subcategory";
      case "PRODUCT":
        return "Product";
      default:
        return type;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-stretch rounded-full text-xs font-medium",
        "max-w-full overflow-hidden"
      )}
    >
      <span
        className={cn(
          "flex items-center rounded-l-full px-2 py-1",
          conditionTypeVariants({ type: condition.conditionType as any })
        )}
      >
        {getTypeLabel(condition.conditionType)}
      </span>
      <span className="bg-muted flex min-w-0 items-center gap-1 border-l px-2 py-1">
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
            <span className="opacity-50">Loading...</span>
          </>
        ) : (
          <span className="line-clamp-1 min-w-0" title={label || condition.value.join(", ")}>
            {label || condition.value.join(", ")}
          </span>
        )}
      </span>
    </span>
  );
}
