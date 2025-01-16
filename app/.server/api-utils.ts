import { data, redirect } from "react-router";
import type { z } from "zod";
import type { ResultsPage } from "~/lib/models";
import { API_BASE_URL } from "./config";
import { logger } from "./logger";
import { requireUserSession } from "./sessions";

type NativeFetchParameters = Parameters<typeof fetch>;
type FetchArguments = {
  url: NativeFetchParameters[0];
  options?: NativeFetchParameters[1];
};

export class FetchOptions {
  private url: NativeFetchParameters[0];
  private options: Exclude<NativeFetchParameters[1], undefined> & {
    headers: Headers;
  };

  constructor(
    url: NativeFetchParameters[0],
    options: NativeFetchParameters[1] = {}
  ) {
    this.url = url;
    this.options = {
      method: "GET",
      ...options,
      headers: new Headers(options?.headers),
    };
  }

  public static builder(
    url: NativeFetchParameters[0],
    options?: NativeFetchParameters[1]
  ) {
    return new FetchOptions(url, options);
  }

  public static url<TPath extends string>(
    path: TPath,
    params?: Record<string, string | number> & PathParams<TPath>
  ) {
    return new FetchOptions(buildUrl(path, params));
  }

  public get() {
    this.options.method = "GET";
    return this;
  }

  public post() {
    this.options.method = "POST";
    return this;
  }

  public patch() {
    this.options.method = "PATCH";
    return this;
  }

  public delete() {
    this.options.method = "DELETE";
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public json(body: any) {
    this.options.body = JSON.stringify(body);
    this.options.headers.set("Content-Type", "application/json");
    return this;
  }

  public build() {
    return {
      url: this.url,
      options: this.options,
    };
  }
}

type AtLeastOneFetch = [FetchArguments, ...FetchArguments[]];
type AtLeastOneAwaitableResponse = [Promise<Response>, ...Promise<Response>[]];
export const fetchAuthenticated = async (
  request: Request,
  setSessionCookie: (cookie: string) => void,
  ...fetchArgs: AtLeastOneFetch
) => {
  const { user, sessionToken } = await requireUserSession(request);
  setSessionCookie(sessionToken);

  return fetchArgs.map(async ({ url, options = {} }) => {
    options.headers = new Headers(options?.headers);
    options.headers.set("Authorization", `Bearer ${user.tokens.accessToken}`);

    return fetch(url, options);
  }) as AtLeastOneAwaitableResponse;
};

export const authenticatedResolver = async (
  request: Request,
  ...fetchArgs: AtLeastOneFetch
) => {
  const resHeaders = new Headers({});
  const responses = await fetchAuthenticated(
    request,
    (cookie) => resHeaders.append("Set-Cookie", cookie),
    ...fetchArgs
  );

  return {
    responses,
    headers: resHeaders,
  };
};

export const defaultDataGetter = async (
  responses: Promise<Response> | AtLeastOneAwaitableResponse
) => {
  const response = Array.isArray(responses) ? responses[0] : responses;
  return response.then(async (r) => {
    if (r.ok) {
      const contentType = r.headers.get("Content-Type");
      if (contentType && /^application\/json(;|$)/i.test(contentType)) {
        return r.json();
      }
      return r.text();
    }
    logger.error(
      {
        status: r.status,
        url: r.url,
        data: await r.json().catch(() => r.text().catch(() => null)),
      },
      "Request failed with code: " + r.status
    );
    throw new Response(r.statusText, { status: r.status });
  });
};

export const authenticatedData = async <T>(
  request: Request,
  fetchArgs: AtLeastOneFetch,
  getData: (
    responses: AtLeastOneAwaitableResponse
  ) => Promise<T> = defaultDataGetter
) => {
  const { responses, headers } = await authenticatedResolver(
    request,
    ...fetchArgs
  );
  return data(await getData(responses), { headers });
};

type ExtractPathParams<TPath extends string> =
  TPath extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : TPath extends `${string}:${infer Param}`
    ? Param
    : never;

type PathParams<TPath extends string> = {
  [Key in ExtractPathParams<TPath>]: string | number;
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
 * @returns the full URL
 */
export const buildUrl = <TPath extends string>(
  path: TPath,
  params?: Record<string, string | number> & PathParams<TPath>
) => {
  const paramsMap = new Map(
    Object.entries(params ?? {}).map(([key, value]) => [key, String(value)])
  );

  const cleanedPath = path.replace(/^\/+/, "").replace(/:(\w+)/g, (_, key) => {
    const value = paramsMap.get(key);
    paramsMap.delete(key);
    return value ?? key;
  });

  const url = new URL(`${API_BASE_URL}/${cleanedPath}`);

  for (const [key, value] of paramsMap) {
    url.searchParams.set(key, value);
  }

  return url;
};

interface AllCrudActions<
  T,
  TCreateSchema extends z.ZodType,
  TUpdateSchema extends z.ZodType
> {
  list: (
    request: Request,
    query: Record<string, string | number>
  ) => Promise<ReturnType<typeof data<ResultsPage<T>>>>;
  get: (request: Request, id: string) => Promise<ReturnType<typeof data<T>>>;
  create: (
    request: Request,
    input: z.infer<TCreateSchema>
  ) => Promise<ReturnType<typeof data<T>>>;
  update: (
    request: Request,
    id: string,
    input: z.infer<TUpdateSchema>
  ) => Promise<ReturnType<typeof data<T>>>;
  delete: (
    request: Request,
    id: string
  ) => Promise<ReturnType<typeof data<unknown>>>;
  deleteAndRedirect: (
    request: Request,
    id: string,
    to: string
  ) => Promise<Response>;
}

type CrudActionName = keyof AllCrudActions<unknown, z.ZodTypeAny, z.ZodTypeAny>;
const CrudActionNames: CrudActionName[] = [
  "list",
  "get",
  "create",
  "update",
  "delete",
  "deleteAndRedirect",
];

function buildCrud<
  T,
  TCreateSchema extends z.ZodType,
  TUpdateSchema extends z.ZodType
>(path: string): AllCrudActions<T, TCreateSchema, TUpdateSchema> {
  const actions = [...CrudActionNames];
  return actions.reduce((acc, action) => {
    switch (action) {
      case "list":
        acc[action] = (
          request: Request,
          query: Record<string, string | number> = {}
        ) => {
          return authenticatedData<ResultsPage<T>>(request, [
            FetchOptions.url(path, query).build(),
          ]);
        };
        break;
      case "get":
        acc[action] = (request: Request, id: string) => {
          return authenticatedData<T>(request, [
            FetchOptions.url(`${path}/:id`, { id }).build(),
          ]);
        };
        break;
      case "create":
        acc[action] = (request: Request, input: z.infer<TCreateSchema>) => {
          return authenticatedData<T>(request, [
            FetchOptions.url(path).post().json(input).build(),
          ]);
        };
        break;
      case "update":
        acc[action] = (
          request: Request,
          id: string,
          input: z.infer<TUpdateSchema>
        ) => {
          return authenticatedData<T>(request, [
            FetchOptions.url(`${path}/:id`, { id }).patch().json(input).build(),
          ]);
        };
        break;
      case "delete":
        acc[action] = (request: Request, id: string) => {
          return authenticatedData(request, [
            FetchOptions.url(`${path}/:id`, { id }).delete().build(),
          ]);
        };
        break;
      case "deleteAndRedirect":
        acc[action] = async (request: Request, id: string, to: string) => {
          return authenticatedData(request, [
            FetchOptions.url(`${path}/:id`, { id }).delete().build(),
          ]).then(({ init }) => redirect(to, init ?? undefined));
        };
        break;
      default:
        break;
    }

    return acc;
  }, {} as AllCrudActions<T, TCreateSchema, TUpdateSchema>);
}

export class CRUD<
  T,
  TCreateSchema extends z.ZodType,
  TUpdateSchema extends z.ZodType
> {
  constructor(private path: string) {}

  public static for<
    T,
    TCreateSchema extends z.ZodType,
    TUpdateSchema extends z.ZodType
  >(path: string) {
    return new CRUD<T, TCreateSchema, TUpdateSchema>(path);
  }

  public all() {
    return buildCrud<T, TCreateSchema, TUpdateSchema>(this.path);
  }

  public only<TActions extends CrudActionName[]>(actions: TActions) {
    return Object.fromEntries(
      Object.entries(this.all()).filter(([action]) =>
        actions.includes(action as CrudActionName)
      )
    ) as Pick<
      AllCrudActions<T, TCreateSchema, TUpdateSchema>,
      TActions[number]
    >;
  }

  public except<TActions extends CrudActionName[]>(actions: TActions) {
    return Object.fromEntries(
      Object.entries(this.all()).filter(
        ([action]) => !actions.includes(action as CrudActionName)
      )
    ) as Omit<
      AllCrudActions<T, TCreateSchema, TUpdateSchema>,
      TActions[number]
    >;
  }
}
