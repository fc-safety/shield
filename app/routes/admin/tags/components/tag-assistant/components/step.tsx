import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function Step({
  className,
  title,
  subtitle,
  onContinue,
  continueDisabled,
  onStepBackward,
  children,
  footerSlotEnd: footerSlotRight,
  footerSlotStart: footerSlotLeft,
}: PropsWithChildren<{
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  onContinue?: () => void;
  continueDisabled?: boolean;
  onStepBackward?: () => void;
  footerSlotEnd?: ReactNode;
  footerSlotStart?: ReactNode;
}>) {
  return (
    <div
      className={cn(
        "w-full max-w-xl flex flex-col items-stretch justify-center gap-4",
        className
      )}
    >
      <div>
        {title && <h3 className="text-center text-lg font-bold">{title}</h3>}
        {subtitle && (
          <h4 className="text-center text-base text-muted-foreground">
            {subtitle}
          </h4>
        )}
      </div>
      {children}
      <div className="flex gap-4">
        {onStepBackward && (
          <Button onClick={onStepBackward} variant="secondary">
            <ArrowLeft /> Back
          </Button>
        )}
        {footerSlotLeft}
        <div className="flex-1" />
        {footerSlotRight}
        {onContinue && (
          <Button onClick={onContinue} disabled={continueDisabled}>
            Continue
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
