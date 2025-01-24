import { useEffect, useRef } from "react";

export function useBlurOnClose({
  onBlur,
  open,
}: {
  onBlur: (() => void) | null | undefined;
  open: boolean;
}) {
  const wasOpened = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpened.current = true;
    } else if (wasOpened.current) {
      onBlur?.();
    }
  }, [open, onBlur]);
}
