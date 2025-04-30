import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export function Paragraph({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <p className={cn("font-light", className)} {...props}>
      {children}
    </p>
  );
}
