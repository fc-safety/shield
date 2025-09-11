import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import ScrollAreaWithHint from "~/components/scroll-area-with-hint";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function Step({
  className,
  title,
  subtitle,
  onContinue,
  continueDisabled,
  continueLoading,
  continueButtonText,
  onStepBackward,
  stepBackwardDisabled,
  children,
  footerSlotEnd: footerSlotRight,
  footerSlotStart: footerSlotLeft,
  growContent,
}: PropsWithChildren<{
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  continueButtonText?: string;
  onStepBackward?: () => void;
  stepBackwardDisabled?: boolean;
  footerSlotEnd?: ReactNode;
  footerSlotStart?: ReactNode;
  growContent?: boolean;
}>) {
  return (
    <div
      className={cn(
        "overflow-hiden flex h-full w-full max-w-xl flex-col items-stretch justify-center gap-4",
        className
      )}
    >
      <div>
        {title && <h3 className="text-center text-lg font-bold">{title}</h3>}
        {subtitle && <h4 className="text-muted-foreground text-center text-base">{subtitle}</h4>}
      </div>
      <ScrollAreaWithHint
        disableDisplayTable
        variant="outline"
        classNames={{ root: growContent ? "grow" : "" }}
      >
        <div className="flex flex-col items-stretch justify-center gap-4">{children}</div>
      </ScrollAreaWithHint>
      <div className="flex gap-4">
        <div className="flex flex-wrap-reverse place-content-start gap-x-4 gap-y-2">
          {onStepBackward && (
            <Button
              onClick={() => onStepBackward()}
              variant="secondary"
              disabled={stepBackwardDisabled}
            >
              <ArrowLeft /> Back
            </Button>
          )}
          {footerSlotLeft}
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap-reverse place-content-start justify-end gap-x-4 gap-y-2">
          {footerSlotRight}
          {onContinue && (
            <Button onClick={() => onContinue()} disabled={continueDisabled || continueLoading}>
              {continueButtonText ?? "Continue"}
              {continueLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
