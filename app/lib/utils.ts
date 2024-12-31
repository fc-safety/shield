import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isNil = (value: unknown): value is null | undefined =>
  value === undefined || value === null;

export const asArray = <T>(value: T | T[]): T[] =>
  isNil(value) ? [] : Array.isArray(value) ? value : [value];

export const countBy = <
  TKey extends string | number | symbol,
  T extends Record<TKey, unknown>
>(
  objs: T[],
  key: TKey
) =>
  Array.from(
    objs
      .reduce((acc, obj) => {
        const value = obj[key];
        let count = acc.get(value);
        if (count === undefined) {
          count = 0;
          acc.set(value, count);
        }
        return acc.set(value, count + 1);
      }, new Map<T[TKey], number>())
      .entries()
  ).map(([value, count]) => ({
    [key]: value,
    count,
  }));

export const dedupById = <T extends { id: string }>(items: T[]) => [
  ...items
    .reduce((acc, item) => {
      acc.set(item.id, item);
      return acc;
    }, new Map<string, T>())
    .values(),
];

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
