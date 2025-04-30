import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
export function SectionHeading({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <h2 className={cn("text-base font-semibold", className)} {...props}>
      {children}
    </h2>
  );
}
