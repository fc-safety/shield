import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";
import { useEffect, useRef } from "react";
import useIsOverflowing from "~/hooks/use-is-overflowing";

import { cn } from "~/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    onIsOverflowingX?: (isOverflowing: boolean) => void;
    onIsOverflowingY?: (isOverflowing: boolean) => void;
    onIsScrollMaxedX?: (isScrollMaxed: boolean) => void;
    onIsScrollMaxedY?: (isScrollMaxed: boolean) => void;
    scrollDisabled?: boolean;
    classNames?: {
      root?: string;
      viewport?: string;
      scrollbar?: string;
    };
    /**
     * Overrides the display style property of one of the underlying radix primitive
     * elements that can cause unexpected behavior with horizontal overflow.
     *
     * See https://github.com/radix-ui/primitives/issues/2964.
     */
    disableDisplayTable?: boolean;
  }
>(
  (
    {
      className,
      children,
      onIsOverflowingX,
      onIsScrollMaxedX,
      onIsOverflowingY,
      onIsScrollMaxedY,
      scrollDisabled,
      classNames,
      disableDisplayTable,
      ...props
    },
    ref
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const { isOverflowingX, isOverflowingY, isScrollMaxedX, isScrollMaxedY, recalculate } =
      useIsOverflowing({
        ref: viewportRef,
        scrollbarOffsetX: 8,
        scrollbarOffsetY: 8,
      });

    useEffect(() => {
      recalculate();
    }, [children]);

    useEffect(() => {
      onIsOverflowingX?.(isOverflowingX);
    }, [isOverflowingX, onIsOverflowingX]);

    useEffect(() => {
      onIsOverflowingY?.(isOverflowingY);
    }, [isOverflowingY, onIsOverflowingY]);

    useEffect(() => {
      onIsScrollMaxedX?.(isScrollMaxedX);
    }, [isScrollMaxedX, onIsScrollMaxedX]);

    useEffect(() => {
      onIsScrollMaxedY?.(isScrollMaxedY);
    }, [isScrollMaxedY, onIsScrollMaxedY]);

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative grid overflow-hidden", className, classNames?.root)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className={cn(
            "h-full w-full rounded-[inherit]",
            scrollDisabled && "touch-none",
            classNames?.viewport,
            disableDisplayTable && "override-scroll-display-table"
          )}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        {!scrollDisabled && <ScrollBar className={classNames?.scrollbar} />}
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  }
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none transition-colors select-none",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-px",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-px",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="bg-border relative flex-1 rounded-full" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
