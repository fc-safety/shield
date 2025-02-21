import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";
import { useEffect, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";

import { cn } from "~/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    onIsOverflowing?: (isOverflowing: boolean) => void;
    scrollDisabled?: boolean;
  }
>(({ className, children, onIsOverflowing, scrollDisabled, ...props }, ref) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { height: viewPortHeight = 0 } = useResizeObserver({
    ref: viewportRef,
    box: "border-box",
  });

  useEffect(() => {
    onIsOverflowing?.(
      !!viewportRef.current?.scrollHeight &&
        viewportRef.current?.scrollHeight > viewPortHeight
    );
  }, [viewportRef.current?.scrollHeight, viewPortHeight, onIsOverflowing]);

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn(
        "relative overflow-y-hidden flex flex-col items-center",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={cn(
          "h-full w-full rounded-[inherit] -mx-[1px] px-[1px]",
          scrollDisabled && "touch-none"
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {!scrollDisabled && <ScrollBar />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
