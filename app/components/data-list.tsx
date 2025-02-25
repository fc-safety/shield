import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";
import { Fragment } from "react/jsx-runtime";
import { cn } from "~/lib/utils";

interface DataListProps {
  title?: string;
  details: {
    label: ReactNode;
    value: ReactNode | undefined | null;
    hidden?: boolean;
  }[];
  defaultValue?: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

export default function DataList({
  title,
  details,
  defaultValue = "",
  className,
  fluid = false,
}: DataListProps) {
  return (
    <div className={cn("grid gap-4", fluid && "w-full", className)}>
      {title && <Label>{title}</Label>}
      <dl
        className={cn(
          "grid gap-y-2 gap-x-4 sm:gap-x-8",
          fluid ? "grid-cols-[auto_auto]" : "grid-cols-2"
        )}
      >
        {details
          .filter(({ hidden }) => !hidden)
          .map(({ label, value }) => (
            <Fragment key={String(label)}>
              <dt className="text-muted-foreground text-sm">{label}</dt>
              <dd className="text-sm">{value || defaultValue}</dd>
            </Fragment>
          ))}
      </dl>
    </div>
  );
}
