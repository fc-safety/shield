import qs from "qs";

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
