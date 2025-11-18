import { useMediaQuery } from "usehooks-ts";

const BREAKPOINT = 768;

export default function useIsMobile({
  maxWidth = BREAKPOINT,
  defaultValue = false,
}: { maxWidth?: number; defaultValue?: boolean } = {}) {
  return useMediaQuery(`(max-width: ${maxWidth}px)`, { defaultValue });
}
