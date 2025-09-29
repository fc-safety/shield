import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import type { AssetQuestionCondition } from "~/lib/models";
import { cn } from "~/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

export const conditionTypeVariants = cva("", {
  variants: {
    type: {
      REGION: "bg-blue-500 text-white dark:bg-blue-400 dark:text-blue-950",
      MANUFACTURER: "bg-purple-500 text-white dark:bg-purple-400 dark:text-purple-950",
      PRODUCT_CATEGORY: "bg-green-500 text-white dark:bg-green-400 dark:text-green-950",
      PRODUCT: "bg-orange-500 text-white dark:bg-orange-400 dark:text-orange-950",
      METADATA: "bg-gray-500 text-white dark:bg-gray-400 dark:text-gray-950",
    },
  },
});

interface ConditionPillProps extends ComponentProps<"span"> {
  condition: Pick<AssetQuestionCondition, "conditionType" | "value">;
  label?: ReactNode;
  isLoading?: boolean;
}

export default function ConditionPill({
  condition,
  label,
  isLoading = false,
  className,
  ...props
}: ConditionPillProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "REGION":
        return "Region";
      case "MANUFACTURER":
        return "Manufacturer";
      case "PRODUCT_CATEGORY":
        return "Category";
      case "PRODUCT":
        return "Product";
      case "METADATA":
        return "Metadata";
      default:
        return type;
    }
  };

  const conditionValueDisplay = useMemo(() => {
    if (label) {
      return label;
    }
    let values = condition.value;
    if (condition.conditionType === "METADATA") {
      values = values.map((v) => {
        const [key, value] = v.split(":");
        return `${key} = ${value || `""`}`;
      });
    }
    return values.join(", ");
  }, [label, condition.conditionType, condition.value]);

  return (
    <span
      className={cn(
        "inline-flex items-stretch rounded-full text-xs font-medium",
        "max-w-full overflow-hidden",
        className
      )}
      {...props}
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
          <HoverCard>
            <HoverCardTrigger className={"inline min-w-0"}>
              <span className="line-clamp-1">{conditionValueDisplay}</span>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit min-w-8 p-2">
              {conditionValueDisplay}
            </HoverCardContent>
          </HoverCard>
        )}
      </span>
    </span>
  );
}
