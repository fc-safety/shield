import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export default function Section({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <section className={cn("space-y-2", className)} {...props}>
      {children}
    </section>
  );
}
