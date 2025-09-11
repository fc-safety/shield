import type { ComponentProps } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function OptionButton({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant">) {
  return (
    <Button
      variant="secondary"
      className={cn(
        "hover:bg-primary hover:text-primary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
