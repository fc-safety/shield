import { useCallback, useEffect, useMemo, useState } from "react";
import { useEventListener, useResizeObserver } from "usehooks-ts";

export default function useIsOverflowing({
  ref,
  scrollbarOffsetX = 0,
  scrollbarOffsetY = 0,
}: {
  ref: React.RefObject<HTMLElement | null>;
  scrollbarOffsetX?: number;
  scrollbarOffsetY?: number;
}) {
  const [viewportWidth, setViewportWidth] = useState(ref.current?.clientWidth ?? 0);
  const [viewportHeight, setViewportHeight] = useState(ref.current?.clientHeight ?? 0);
  const [scrollWidth, setScrollWidth] = useState(ref.current?.scrollWidth ?? 0);
  const [scrollHeight, setScrollHeight] = useState(ref.current?.scrollHeight ?? 0);

  const handleResize = useCallback(
    ({ width, height }: { width?: number; height?: number }) => {
      const el = ref.current;
      setViewportWidth(width ?? el?.clientWidth ?? 0);
      setViewportHeight(height ?? el?.clientHeight ?? 0);
      setScrollWidth(el?.scrollWidth ?? 0);
      setScrollHeight(el?.scrollHeight ?? 0);
    },
    [ref]
  );

  useResizeObserver({
    ref: ref as React.RefObject<HTMLElement>,
    box: "border-box",
    onResize: handleResize,
  });

  useEffect(() => {
    handleResize({});
  }, [handleResize, ref.current]);

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEventListener(
    "scroll",
    () => {
      setScrollLeft(ref.current?.scrollLeft ?? 0);
      setScrollTop(ref.current?.scrollTop ?? 0);
    },
    ref as React.RefObject<HTMLElement>
  );

  const isOverflowingY = useMemo(() => {
    return scrollHeight - scrollbarOffsetY > viewportHeight;
  }, [scrollHeight, viewportHeight, scrollbarOffsetY]);

  const isOverflowingX = useMemo(() => {
    return scrollWidth - scrollbarOffsetX > viewportWidth;
  }, [scrollWidth, viewportWidth, scrollbarOffsetX]);

  const isScrollMaxedY = useMemo(() => {
    return scrollTop === scrollHeight - viewportHeight;
  }, [scrollTop, scrollHeight, viewportHeight]);

  const isScrollMaxedX = useMemo(() => {
    return scrollLeft === scrollWidth - viewportWidth;
  }, [scrollLeft, scrollWidth, viewportWidth]);

  return {
    isOverflowingY,
    isOverflowingX,
    isScrollMaxedY,
    isScrollMaxedX,
    recalculate: () => handleResize({}),
  };
}
