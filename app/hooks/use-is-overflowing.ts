import { useMemo, useState } from "react";
import { useEventListener, useResizeObserver } from "usehooks-ts";

export default function useIsOverflowing({
  ref,
}: {
  ref: React.RefObject<HTMLDivElement>;
}) {
  const { height: viewportHeight = 0, width: viewportWidth = 0 } =
    useResizeObserver({
      ref,
      box: "border-box",
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
    return (
      !!ref.current?.scrollHeight && ref.current.scrollHeight > viewportHeight
    );
  }, [ref, viewportHeight]);

  const isOverflowingX = useMemo(() => {
    return (
      !!ref.current?.scrollWidth && ref.current.scrollWidth > viewportWidth
    );
  }, [ref, viewportWidth]);

  const isScrollMaxedY = useMemo(() => {
    return scrollTop === (ref.current?.scrollHeight ?? 0) - viewportHeight;
  }, [scrollTop, ref, viewportHeight]);

  const isScrollMaxedX = useMemo(() => {
    return scrollLeft === (ref.current?.scrollWidth ?? 0) - viewportWidth;
  }, [scrollLeft, ref, viewportWidth]);

  return {
    isOverflowingY,
    isOverflowingX,
    isScrollMaxedY,
    isScrollMaxedX,
  };
}
