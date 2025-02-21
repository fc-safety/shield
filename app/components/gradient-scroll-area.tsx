import {
  forwardRef,
  useState,
  type ComponentProps,
  type PropsWithChildren,
} from "react";
import { cn } from "~/lib/utils";
import { ScrollArea } from "./ui/scroll-area";

interface GradientScrollAreaProps
  extends PropsWithChildren<ComponentProps<typeof ScrollArea>> {
  variant?: "card" | "background";
}

const GradientScrollArea = forwardRef<HTMLDivElement, GradientScrollAreaProps>(
  ({ children, variant = "background", ...props }, ref) => {
    const [isOverflowing, setIsOverflowing] = useState(false);

    return (
      <ScrollArea {...props} onIsOverflowing={setIsOverflowing} ref={ref}>
        {children}
        {isOverflowing && (
          <>
            <div
              className={cn(
                "absolute w-full bottom-0 left-0 h-6 bg-gradient-to-t to-transparent",
                variant === "card" ? "from-card" : "from-background"
              )}
            ></div>
            <div className="pt-6 w-full"></div>
          </>
        )}
      </ScrollArea>
    );
  }
);

GradientScrollArea.displayName = "GradientScrollArea";

export default GradientScrollArea;
