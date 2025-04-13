import { useMemo, useState } from "react";
import { useEventListener, useResizeObserver } from "usehooks-ts";

export default function useIsOverflowing({
  ref,
  scrollbarOffsetX = 0,
  scrollbarOffsetY = 0,
}: {
  ref: React.RefObject<HTMLDivElement>;
  scrollbarOffsetX?: number;
  scrollbarOffsetY?: number;
}) {
  const [viewportWidth, setViewportWidth] = useState(
    ref.current?.clientWidth ?? 0
  );
  const [viewportHeight, setViewportHeight] = useState(
    ref.current?.clientHeight ?? 0
  );
  const [scrollWidth, setScrollWidth] = useState(ref.current?.scrollWidth ?? 0);
  const [scrollHeight, setScrollHeight] = useState(
    ref.current?.scrollHeight ?? 0
  );

  useResizeObserver({
    ref,
    box: "border-box",
    onResize: ({ width, height }) => {
      const el = ref.current;
      if (!el) return;
      setViewportWidth(width ?? el.clientWidth);
      setViewportHeight(height ?? el.clientHeight);
      setScrollWidth(el.scrollWidth);
      setScrollHeight(el.scrollHeight);
    },
  });

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEventListener(
    "scroll",
    () => {
      setScrollLeft(ref.current?.scrollLeft ?? 0);
      setScrollTop(ref.current?.scrollTop ?? 0);
    },
    ref
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
  };
}
