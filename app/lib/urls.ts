import JSON5 from "json5";
import qs from "qs";
import { isNil } from "./utils";

type ExtractPathParams<TPath extends string> =
  TPath extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : TPath extends `${string}:${infer Param}`
      ? Param
      : never;

export type PathParams<TPath extends string> = {
  [Key in ExtractPathParams<TPath>]: string | number;
};

type BaseQueryParamValue = string | number | boolean | null | undefined;
export interface QueryParams {
  [key: string]: BaseQueryParamValue | BaseQueryParamValue[] | QueryParams | QueryParams[];
}

export const isAbsoluteUrl = (url: string) => {
  return /^[a-z]+:\/\//.test(url);
};

export const stringifyQuery = qs.stringify;

export const buildPath = <TPath extends string>(
  path: TPath,
  params?: QueryParams & PathParams<TPath>,
  basePath = ""
) => {
  const urlObj = new URL(path, "https://example.com");

  const paramsMap = new Map(Object.entries(params ?? {}));
  for (const [key, value] of urlObj.searchParams.entries()) {
    paramsMap.set(key, value);
  }

  const cleanedBasePath = basePath.replace(/\/+$/, "");
  const cleanedPath = urlObj.pathname.replace(/^\/+/, "").replace(/:(\w+)/g, (_, key) => {
    const value = paramsMap.get(key);
    paramsMap.delete(key);
    return String(value) ?? key;
  });
  const searchString = paramsMap.size ? `?${qs.stringify(Object.fromEntries(paramsMap))}` : "";

  return `${cleanedBasePath}/${cleanedPath}${searchString}`;
};

/**
 * Given a path and params, build a full URL by replacing path params and adding any
 * remaining params as query string parameters.
 *
 * @example
 * buildUrl("/users/:id", { id: 5 }) // "https://example.com/users/5"
 * buildUrl("/users/:id", { id: 5, sort: "name" }) // "https://example.com/users/5?sort=name"
 * @param path the path to build the URL from
 * @param params the params to replace path params and add as query string params
 * @param baseUrl the base URL to use
 * @returns the full URL
 */
export const buildUrl = <TPath extends string>(
  path: TPath,
  baseUrl: string,
  params?: QueryParams & PathParams<TPath>
) => {
  return new URL(buildPath<TPath>(path, params, baseUrl));
};

// Custom function to update query parameters without navigation
export function updateQueryParams(
  updates: URLSearchParams | string | ((prev: URLSearchParams) => URLSearchParams | string),
  options: { replace?: boolean } = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  const { replace = false } = options;

  // Get current URL and search params
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);

  // Handle different types of updates
  if (typeof updates === "function") {
    // Functional update: updates((prev) => newParams)
    const currentParams = new URLSearchParams(searchParams);
    const newParams = updates(currentParams);

    // Clear existing params and set new ones
    url.search = newParams.toString();
  } else if (updates instanceof URLSearchParams) {
    // Direct URLSearchParams object
    url.search = updates.toString();
  } else if (typeof updates === "object" && updates !== null) {
    // Object with key-value pairs
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        searchParams.delete(key);
      } else {
        searchParams.set(key, String(value));
      }
    });
    url.search = searchParams.toString();
  } else if (typeof updates === "string") {
    // Raw query string
    url.search = updates.startsWith("?") ? updates.slice(1) : updates;
  }

  // Update the URL without navigation
  if (replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

export const getQueryStatePersistor = (key: string) => (value: object) => {
  updateQueryParams(
    (prev) => {
      if (isNil(value) || (Array.isArray(value) && value.length === 0)) {
        prev.delete(key);
        return prev;
      }
      prev.set(key, JSON5.stringify(value));
      return prev;
    },
    {
      replace: true,
    }
  );
};

export const getQueryPersistedState = (key: string, searchParams: URLSearchParams) => {
  if (searchParams.has(key)) {
    try {
      return JSON5.parse(searchParams.get(key)!);
    } catch {
      return undefined;
    }
  }
  return undefined;
};
