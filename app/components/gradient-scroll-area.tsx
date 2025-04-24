import {
  forwardRef,
  useCallback,
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
  (
    {
      children,
      variant = "background",
      className,
      onIsOverflowingX,
      onIsScrollMaxedX,
      onIsOverflowingY,
      onIsScrollMaxedY,
      ...props
    },
    ref
  ) => {
    const [isOverflowingX, setIsOverflowingX] = useState(false);
    const [isScrollMaxedX, setIsScrollMaxedX] = useState(false);
    const [isOverflowingY, setIsOverflowingY] = useState(false);
    const [isScrollMaxedY, setIsScrollMaxedY] = useState(false);

    const handleIsOverflowingX = useCallback(
      (isOverflowing: boolean) => {
        setIsOverflowingX(isOverflowing);
        onIsOverflowingX?.(isOverflowing);
      },
      [onIsOverflowingX]
    );

    const handleIsScrollMaxedX = useCallback(
      (isScrollMaxed: boolean) => {
        setIsScrollMaxedX(isScrollMaxed);
        onIsScrollMaxedX?.(isScrollMaxed);
      },
      [onIsScrollMaxedX]
    );

    const handleIsOverflowingY = useCallback(
      (isOverflowing: boolean) => {
        setIsOverflowingY(isOverflowing);
        onIsOverflowingY?.(isOverflowing);
      },
      [onIsOverflowingY]
    );

    const handleIsScrollMaxedY = useCallback(
      (isScrollMaxed: boolean) => {
        setIsScrollMaxedY(isScrollMaxed);
        onIsScrollMaxedY?.(isScrollMaxed);
      },
      [onIsScrollMaxedY]
    );

    return (
      <ScrollArea
        {...props}
        className={cn("relative", className)}
        onIsOverflowingX={handleIsOverflowingX}
        onIsOverflowingY={handleIsOverflowingY}
        onIsScrollMaxedX={handleIsScrollMaxedX}
        onIsScrollMaxedY={handleIsScrollMaxedY}
        ref={ref}
      >
        {children}
        {isOverflowingX && (
          <>
            <div
              className={cn(
                "absolute h-full top-0 right-0 w-6 bg-linear-to-l to-transparent transition-all",
                variant === "card" ? "from-card" : "from-background",
                isScrollMaxedX && "translate-x-full"
              )}
            ></div>
          </>
        )}
        {isOverflowingY && (
          <>
            <div
              className={cn(
                "absolute w-full bottom-0 left-0 h-6 bg-linear-to-t to-transparent transition-all",
                variant === "card" ? "from-card" : "from-background",
                isScrollMaxedY && "translate-y-full"
              )}
            ></div>
          </>
        )}
      </ScrollArea>
    );
  }
);

GradientScrollArea.displayName = "GradientScrollArea";

export default GradientScrollArea;
