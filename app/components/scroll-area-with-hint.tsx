import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import {
  forwardRef,
  useCallback,
  useState,
  type ComponentProps,
  type PropsWithChildren,
} from "react";
import { cn } from "~/lib/utils";
import { ScrollArea } from "./ui/scroll-area";

type ScrollAreaWithHintProps = PropsWithChildren<ComponentProps<typeof ScrollArea>> &
  VariantProps<typeof scrollHintVariants>;

const ScrollAreaWithHint = forwardRef<HTMLDivElement, ScrollAreaWithHintProps>(
  (
    {
      children,
      variant,
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

    const showScrollHintsX = isOverflowingX && !isScrollMaxedX;
    const showScrollHintsY = isOverflowingY && !isScrollMaxedY;

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
        <ScrollHint show={showScrollHintsY} variant={variant} />
      </ScrollArea>
    );
  }
);

ScrollAreaWithHint.displayName = "ScrollAreaWithHint";

export default ScrollAreaWithHint;

const scrollHintVariants = cva(
  "z-20 pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md border px-2 py-1 text-xs drop-shadow-lg backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "text-muted-foreground bg-muted/50 border-border",
        outline: "text-secondary-foreground bg-secondary/50 border-secondary-foreground",
      },
    },
  }
);

const ScrollHint = ({
  show,
  variant,
}: { show: boolean } & VariantProps<typeof scrollHintVariants>) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
              type: "spring",
              damping: 8,
              stiffness: 100,
              duration: 0.6,
            },
          }}
          exit={{
            opacity: 0,
            scale: 0.8,
            y: 10,
            transition: { duration: 0.2 },
          }}
          className={scrollHintVariants({ variant })}
        >
          Scroll &darr;
        </motion.div>
      )}
    </AnimatePresence>
  );
};
