import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";
import { Fragment } from "react/jsx-runtime";
import { cn } from "~/lib/utils";
import HelpPopover from "./help-popover";

interface DataListProps {
  title?: string;
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
  };
  /**
   * @deprecated Use `classNames.container` instead
   */
  className?: string;
  fluid?: boolean;
  emptyListMessage?: string;
}

export default function DataList({
  title,
  details,
  defaultValue = "",
  classNames,
  className,
  fluid = false,
  emptyListMessage = "No data available.",
}: DataListProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        fluid && "w-full",
        className,
        classNames?.container
      )}
    >
      {title && <Label>{title}</Label>}
      <dl
        className={cn(
          "grid items-start gap-y-2 gap-x-4 sm:gap-x-8",
          fluid ? "grid-cols-[auto_1fr]" : "grid-cols-2",
          classNames?.details
        )}
      >
        {details
          .filter(({ hidden }) => !hidden)
          .map(({ label, value, help }) => (
            <Fragment key={String(label)}>
              <dt
                className={cn(
                  "text-muted-foreground text-sm flex items-center gap-1",
                  classNames?.detailLabel
                )}
              >
                {label} {help && <HelpPopover>{help}</HelpPopover>}
              </dt>
              <dd className="text-sm">{value || defaultValue}</dd>
            </Fragment>
          ))}
        {details.length === 0 && (
          <dd className="text-xs italic text-muted-foreground col-span-full text-center">
            {emptyListMessage}
          </dd>
        )}
      </dl>
    </div>
  );
}
