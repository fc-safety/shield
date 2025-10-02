import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";
import { Fragment } from "react/jsx-runtime";
import { cn } from "~/lib/utils";
import HelpPopover from "./help-popover";

interface DataListProps {
  title?: ReactNode;
  details: {
    label: ReactNode;
    value: ReactNode | undefined | null;
    help?: ReactNode;
    hidden?: boolean;
  }[];
  defaultValue?: React.ReactNode;
  classNames?: {
    container?: string;
    details?: string;
    detailLabel?: string;
    detailValue?: string;
  };
  /**
   * @deprecated Use `classNames.container` instead
   */
  className?: string;
  /**
   * @deprecated Use `variant` instead
   */
  fluid?: boolean;
  variant?: "default" | "fluid" | "thirds";
  emptyListMessage?: string;
}

export default function DataList({
  title,
  details,
  defaultValue = "",
  classNames,
  className,
  fluid = false,
  variant = "default",
  emptyListMessage = "No data available.",
}: DataListProps) {
  return (
    <div className={cn("grid gap-4", fluid && "w-full", className, classNames?.container)}>
      {title && <Label className="col-span-full">{title}</Label>}
      <dl
        className={cn(
          "grid items-start gap-x-4 gap-y-2 sm:gap-x-8",
          variant === "fluid" || fluid ? "grid-cols-[auto_1fr]" : "grid-cols-2",
          variant === "thirds" && "grid-cols-3",
          classNames?.details
        )}
      >
        {details
          .filter(({ hidden }) => !hidden)
          .map(({ label, value, help }) => (
            <Fragment key={String(label)}>
              <dt
                className={cn(
                  "text-muted-foreground flex items-center gap-1 text-sm font-light",
                  classNames?.detailLabel
                )}
              >
                {label} {help && <HelpPopover>{help}</HelpPopover>}
              </dt>
              <dd
                className={cn(
                  "text-sm",
                  variant === "thirds" && "col-span-2",
                  classNames?.detailValue
                )}
              >
                {value || defaultValue}
              </dd>
            </Fragment>
          ))}
        {details.length === 0 && (
          <dd className="text-muted-foreground col-span-full text-center text-xs italic">
            {emptyListMessage}
          </dd>
        )}
      </dl>
    </div>
  );
}
