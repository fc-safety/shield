import { clsx, type ClassValue } from "clsx";
import { endOfDay, format, isAfter, isValid, parse, parseISO } from "date-fns";
import type { LoaderFunctionArgs, MetaDescriptor } from "react-router";
import { twMerge } from "tailwind-merge";
import * as z3 from "zod/v3";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isNil = (value: unknown): value is null | undefined =>
  value === undefined || value === null;

export const isEmpty = (value: unknown): value is null | undefined | "" =>
  isNil(value) || (typeof value === "string" && value.trim() === "");

export const asArray = <T>(value: T | T[]): T[] =>
  isNil(value) ? [] : Array.isArray(value) ? value : [value];

export const countBy = <TKey extends string | number | symbol, T extends Record<TKey, unknown>>(
  objs: T[],
  key: TKey
) =>
  Array.from(
    objs
      .reduce((acc, obj) => {
        const value = obj[key];
        const countedObjs = acc.get(value) ?? [];
        return acc.set(value, [...countedObjs, obj]);
      }, new Map<T[TKey], T[]>())
      .entries()
  ).map(
    ([value, countedObjs]) =>
      ({
        [key]: value,
        count: countedObjs.length,
        items: countedObjs,
      }) as Record<TKey, T[TKey]> & { count: number; items: T[] }
  );

export const dedupById = <T extends { id: string }>(items: T[]) => [
  ...items
    .reduce((acc, item) => {
      acc.set(item.id, item);
      return acc;
    }, new Map<string, T>())
    .values(),
];

export const breadcrumbHandlerSchema = z3.object({
  handle: z3.object({
    breadcrumb: z3
      .function()
      .args(
        z3
          .object({
            handle: z3.any().optional(),
          })
          .optional()
      )
      .returns(z3.object({ label: z3.string() })),
  }),
});

type BreadcrumbHandler = z3.infer<typeof breadcrumbHandlerSchema>;

export function validateBreadcrumb<M>(match: M): match is M & BreadcrumbHandler {
  return breadcrumbHandlerSchema.safeParse(match).success;
}

export function buildTitle(
  matches: ({ meta: MetaDescriptor[] } | undefined)[],
  ...titleSegments: (string | undefined)[]
) {
  const title = titleSegments.filter((s) => !!s).join(" | ");
  const rootTitle = matches.at(0)?.meta.find((m): m is { title: string } => "title" in m)?.title;

  if (rootTitle) {
    return title ? `${title} | ${rootTitle}` : rootTitle;
  }

  if (title) {
    return title;
  }

  return "Shield | FC Safety";
}

export function buildTitleFromBreadcrumb(matches: ({ meta: MetaDescriptor[] } | undefined)[]) {
  const breadcrumbLabels = matches
    .filter(validateBreadcrumb)
    .map((m) => m.handle.breadcrumb(m).label)
    .filter((label) => !!label)
    .reverse();

  return buildTitle(matches, ...breadcrumbLabels);
}

const PHONE_NUMBER_FORMATTING_REGEX =
  /^(?<ccp>\+?)(?<cc>(?<=\+)1)?\s*\(?(?<ac>\d{1,3})?\)?\s*(?<p1>\d{1,3})?\s*-?\s*(?<p2>\d{1,4})?.*$/;
export const beautifyPhone = (phoneNumber: string) => {
  phoneNumber = phoneNumber
    .trim()
    .replace(/[^+\d\s]/g, "")
    .replace(/\s\s/g, " ");

  const match = phoneNumber.match(PHONE_NUMBER_FORMATTING_REGEX);

  if (!match || !match.groups) {
    return phoneNumber;
  }

  const { ccp, cc, ac, p1, p2 } = match.groups;

  let formattedPhoneNumber = "";

  if (ccp && !cc) {
    formattedPhoneNumber += "+";
  }

  if (cc) {
    formattedPhoneNumber += `+${cc}`;
  }

  if (ac) {
    if (cc) {
      formattedPhoneNumber += " ";
    } else {
      formattedPhoneNumber = "";
    }

    formattedPhoneNumber += `(${ac}`;
  }

  if (p1) {
    formattedPhoneNumber += `) ${p1}`;
  }

  if (p2) {
    formattedPhoneNumber += `-${p2}`;
  }

  return formattedPhoneNumber;
};

export const stripPhone = (phoneNumber: string) => {
  return phoneNumber.replace(/[^+\d]/g, "");
};

export const getSearchParams = (request: Request) =>
  URL.parse(request.url)?.searchParams ?? new URLSearchParams();
export const getSearchParam = (request: Request, key: string) => getSearchParams(request).get(key);
export const validateSearchParam = (request: Request, key: string, message?: string) => {
  const value = getSearchParams(request).get(key);
  if (!value) {
    throw new Response(message ?? `Query parameter '${key}' is required`, {
      status: 400,
    });
  }
  return value;
};

export const validateParam = (
  params: LoaderFunctionArgs["params"],
  key: string,
  message?: string
) => {
  const value = params[key];
  if (!value) {
    throw new Response(message ?? `URL parameter '${key}' is required`, {
      status: 400,
    });
  }
  return value;
};

export const validateParams = <TKey extends string>(
  params: LoaderFunctionArgs["params"],
  keys: TKey[],
  message?: string
) => {
  const validated = {} as Record<TKey, string>;

  for (const key of keys) {
    const value = params[key];
    if (!value) {
      throw new Response(message ?? `URL parameter '${key}' is required`, {
        status: 400,
      });
    }
    validated[key] = value;
  }

  return validated;
};

export const humanize = <T extends string | null | undefined>(
  str: T,
  options: { lowercase?: boolean } = {}
) => {
  if (!str) return str;

  let result = str.replace(/_/g, " ").toLowerCase();

  if (!options.lowercase) {
    result = result.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return result;
};

export const slugify = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
};

export const objectsEqual = (a: unknown, b: unknown) => {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!objectsEqual(a[key as keyof typeof a], b[key as keyof typeof b])) return false;
  }
  return true;
};

export function capitalize(active: string) {
  return active.charAt(0).toUpperCase() + active.slice(1);
}

export function dateSort<T extends Record<K, string | number | Date>, K extends keyof T>(
  key: K,
  desc = true
) {
  return (a: T, b: T) => {
    return isAfter(a[key], b[key]) ? (desc ? -1 : 1) : desc ? 1 : -1;
  };
}

export function formatTimestampAsDate(rawTimestamp: string) {
  const timestamp = String(rawTimestamp);
  return isValid(parseISO(timestamp))
    ? format(parseISO(timestamp), "yyyy-MM-dd")
    : isValid(parse(timestamp, "yyyy-MM-dd", new Date()))
      ? timestamp
      : undefined;
}

export function formatDateAsTimestamp(rawDate: string, atEndOfDay = false) {
  const date = String(rawDate);
  const parsedDate = parseISO(date);
  return atEndOfDay ? endOfDay(parsedDate).toISOString() : parsedDate.toISOString();
}
