import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Step from "~/components/assistant/components/step";
import Icon from "~/components/icons/icon";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Skeleton } from "~/components/ui/skeleton";
import type { ViewContext } from "~/contexts/view-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { cn } from "~/lib/utils";
import { getCategoriesByProductQuery } from "../../services/product.service";

export default function StepSelectCategoryOrExistingAsset({
  productCategoryId,
  setProductCategoryId,
  onContinue,
  onStepBackward,
  allowSelectExistingAsset,
  clientId,
  viewContext,
}: {
  onStepBackward?: () => void;
  onContinue: (options: { skipToSelectExistingAsset?: boolean }) => void;
  productCategoryId?: string;
  setProductCategoryId: (productCategoryId: string) => void;
  allowSelectExistingAsset?: boolean;
  clientId?: string;
  viewContext?: ViewContext;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { data: categories, isLoading } = useQuery(
    getCategoriesByProductQuery(fetchOrThrow, { clientId, viewContext })
  );

  return (
    <Step
      title="Which category is this asset?"
      subtitle={
        allowSelectExistingAsset
          ? "Select a category or continue with an existing asset."
          : "Select a category to continue."
      }
      onContinue={() => onContinue({ skipToSelectExistingAsset: false })}
      continueDisabled={!productCategoryId}
      onStepBackward={onStepBackward}
      footerSlotEnd={
        allowSelectExistingAsset && (
          <Button variant="outline" onClick={() => onContinue({ skipToSelectExistingAsset: true })}>
            Continue with existing asset
          </Button>
        )
      }
    >
      <RadioGroup
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4"
        value={productCategoryId ?? ""}
        onValueChange={(id) => {
          setProductCategoryId(id);
          onContinue({ skipToSelectExistingAsset: false });
        }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={"loading-" + index} className="h-full min-h-24 w-full rounded-2xl" />
            ))
          : (categories ?? []).map((category) => (
              <div
                key={category.id}
                className={cn(
                  "relative cursor-pointer rounded-2xl transition-all",
                  "bg-linear-to-b from-(--category-color)/20 to-(--category-color)/30",
                  "[&:has([data-state=checked])]:bg-(--category-color)/20 [&:has([data-state=checked])]:shadow-md",
                  "hover:bg-(--category-color)/20 hover:shadow-xl"
                )}
                style={
                  {
                    ["--category-color"]: category.color ?? "transparent",
                  } as React.CSSProperties
                }
              >
                <RadioGroupItem
                  key={category.id}
                  id={category.id}
                  value={category.id}
                  className="peer sr-only"
                />
                <CheckCircle2 className="text-primary fill-primary/15 dark:fill-primary/25 absolute top-2 right-2 hidden size-6 peer-data-[state=checked]:block" />
                <Label
                  htmlFor={category.id}
                  className={cn("block h-full cursor-pointer font-semibold")}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-4">
                    <div className="flex items-center justify-center gap-1">
                      <Icon
                        iconId={category.icon ?? "box"}
                        color={category.color}
                        className="text-lg"
                      />
                      <span className="text-base">{category.shortName}</span>
                    </div>
                    <span className="self-stretch text-center text-xs">{category.name}</span>
                  </div>
                </Label>
              </div>
            ))}
      </RadioGroup>
    </Step>
  );
}

StepSelectCategoryOrExistingAsset.StepId = "select-category-or-existing-asset";
