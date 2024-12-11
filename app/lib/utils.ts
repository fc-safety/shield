import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BreadcrumbItem {
  label: string;
}

export function validateBreadcrumb<
  M extends { handle?: unknown } | undefined,
  T extends {
    breadcrumb: (match: M) => BreadcrumbItem;
  }
>(match: M): match is M & { handle: T } {
  return (
    !!match?.handle &&
    typeof match.handle === "object" &&
    "breadcrumb" in match.handle &&
    typeof match.handle.breadcrumb === "function"
  );
}
