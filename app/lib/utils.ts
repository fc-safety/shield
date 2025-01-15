import { clsx, type ClassValue } from "clsx";
import type { FieldValues, Resolver } from "react-hook-form";
import type { LoaderFunctionArgs, MetaDescriptor } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

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
  ).map(
    ([value, count]) =>
      ({
        [key]: value,
        count,
      } as Record<TKey, T[TKey]> & { count: number })
  );

export const dedupById = <T extends { id: string }>(items: T[]) => [
  ...items
    .reduce((acc, item) => {
      acc.set(item.id, item);
      return acc;
    }, new Map<string, T>())
    .values(),
];

export const breadcrumbHandlerSchema = z.object({
  handle: z.object({
    breadcrumb: z
      .function()
      .args(
        z
          .object({
            handle: z.any().optional(),
          })
          .optional()
      )
      .returns(z.object({ label: z.string() })),
  }),
});

type BreadcrumbHandler = z.infer<typeof breadcrumbHandlerSchema>;

export function validateBreadcrumb<M>(
  match: M
): match is M & BreadcrumbHandler {
  return breadcrumbHandlerSchema.safeParse(match).success;
}

export function buildTitle(
  matches: ({ meta: MetaDescriptor[] } | undefined)[],
  ...titleSegments: string[]
) {
  const title = titleSegments.filter((s) => !!s).join(" | ");
  const rootTitle = matches
    .at(0)
    ?.meta.find((m): m is { title: string } => "title" in m)?.title;

  if (rootTitle) {
    return title ? `${title} | ${rootTitle}` : rootTitle;
  }

  if (title) {
    return title;
  }

  return "Shield | FC Safety";
}

export function buildTitleFromBreadcrumb(
  matches: ({ meta: MetaDescriptor[] } | undefined)[]
) {
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
export const getSearchParam = (request: Request, key: string) =>
  getSearchParams(request).get(key);
export const validateSearchParam = (
  request: Request,
  key: string,
  message?: string
) => {
  const value = getSearchParams(request).get(key);
  if (!value) {
    throw new Error(message ?? `Query parameter '${key}' is required`);
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
    throw new Error(message ?? `URL parameter '${key}' is required`);
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
      throw new Error(message ?? `URL parameter '${key}' is required`);
    }
    validated[key] = value;
  }

  return validated;
};

export const getValidatedFormDataOrThrow = async <T extends FieldValues>(
  request: Request | FormData,
  resolver: Resolver<T>,
  preserveStringified?: boolean
) => {
  const { data, errors, receivedValues } = await getValidatedFormData<T>(
    request,
    resolver,
    preserveStringified
  );
  if (errors) {
    throw Response.json({ errors }, { status: 400 });
  }
  return { data: data as T, receivedValues };
};
