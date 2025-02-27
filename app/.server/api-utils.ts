import { data, redirect } from "react-router";
import type { z } from "zod";
import type { ResultsPage } from "~/lib/models";
import { buildUrl, type PathParams, type QueryParams } from "~/lib/urls";
import { config } from "./config";
import { logger } from "./logger";
import {
  refreshTokensOrRelogin,
  requireUserSession,
  type LoginRedirectOptions,
} from "./sessions";

type NativeFetchParameters = Parameters<typeof fetch>;
type FetchArguments = {
  url: NativeFetchParameters[0];
  options?: NativeFetchParameters[1];
};

const VIEW_CONTEXTS = ["admin", "user"] as const;
export type ViewContext = (typeof VIEW_CONTEXTS)[number];

type FetchBuildOptions = {
  context?: ViewContext;
  params?: QueryParams;
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
    params?: QueryParams & PathParams<TPath>
  ) {
    return new FetchOptions(buildUrl(path, config.API_BASE_URL, params));
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

  public build(options: FetchBuildOptions = {}) {
    if (options.context) {
      this.options.headers.set("X-View-Context", options.context);
    }
    return {
      url: this.url,
      options: this.options,
    };
  }
}

export const tryJson = async <T = unknown>(
  response: Response
): Promise<{
  body: T | string;
  isJson: boolean;
}> => {
  const contentType = response.headers.get("Content-Type");
  if (contentType && /^application\/json(;|$)/i.test(contentType)) {
    return { body: await response.json(), isJson: true };
  }
  return { body: await response.text(), isJson: false };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataOrError<T> = { data?: T; error?: any };

export const mergeInit = (
  responseInit1: ResponseInit | null,
  responseInit2: ResponseInit | null
) => {
  if (!responseInit1 || !responseInit2) {
    return responseInit1 ?? responseInit2;
  }

  const mergedHeaders = new Headers(responseInit1.headers);
  const headersToMerge = new Headers(responseInit2.headers);
  headersToMerge.forEach((value, key) => {
    mergedHeaders.set(key, value);
  });
  return { ...responseInit1, headers: mergedHeaders };
};

export class DataResponse<T> extends Promise<ReturnType<typeof data<T>>> {
  public mapTo<U>(fn: (initData: T) => U | Promise<U>) {
    return this.then(async ({ data: initData, init }) =>
      data(await fn(initData), init ?? undefined)
    ) as DataResponse<Awaited<U>>;
  }

  public mapWith<U>(fn: (initData: T) => DataResponse<U>) {
    return this.then(({ data: initData, init: thisInit }) =>
      fn(initData).then(({ data: thatData, init: thatInit }) =>
        data(thatData, mergeInit(thisInit, thatInit) ?? undefined)
      )
    ) as DataResponse<Awaited<U>>;
  }

  public mergeWith<U>(other: DataResponse<U>) {
    return DataResponse.all([this, other]).then(
      ([
        { data: thisData, init: thisInit },
        { data: otherData, init: otherInit },
      ]) =>
        data([thisData, otherData], mergeInit(thisInit, otherInit) ?? undefined)
    ) as DataResponse<[T, U]>;
  }

  public mergeInit(init: ResponseInit | null) {
    return this.then(({ data: thisData, init: thisInit }) =>
      data(thisData, mergeInit(thisInit, init) ?? undefined)
    ) as DataResponse<T>;
  }

  public async asRedirect(url: string) {
    return this.then(({ init }) => redirect(url, init ?? undefined));
  }

  public catchResponse(): DataResponse<DataOrError<T>> {
    return (
      this.then(({ data: initData, init }) =>
        data({ data: initData }, init ?? undefined)
      ) as DataResponse<DataOrError<T>>
    ).catch(async (errorOrResponse) => {
      if (errorOrResponse instanceof Response) {
        return data(
          {
            error: await tryJson(errorOrResponse).then(({ body }) => body),
          },
          { status: errorOrResponse.status }
        );
      }
      logger.error(errorOrResponse);
      return data({ error: errorOrResponse.message }, { status: 500 });
    }) as DataResponse<DataOrError<T>>;
  }
}

type AtLeastOneFetch = [FetchArguments, ...FetchArguments[]];
type AtLeastOneAwaitableResponse = [Promise<Response>, ...Promise<Response>[]];
export const fetchAuthenticated = async (
  request: Request,
  setSessionCookie: (cookie: string) => void,
  fetchArgs: AtLeastOneFetch,
  options: LoginRedirectOptions = {}
) => {
  const { user, session, getSessionToken } = await requireUserSession(
    request,
    options
  );

  const getResponses = (accessToken: string) => {
    return fetchArgs.map(async ({ url, options = {} }) => {
      options.headers = new Headers(options?.headers);
      options.headers.set("Authorization", `Bearer ${accessToken}`);

      return fetch(url, options);
    }) as AtLeastOneAwaitableResponse;
  };

  let awaitableResponses = getResponses(user.tokens.accessToken);

  // Peek at the first response returned to see if it's a 401.
  // This is the most efficient way to find out if the token is still active.
  // For the majority of requests, the status will be 200, and we can bypass
  // any other token validation. Only on a 401 do we take the time to refresh
  // or reinitiate login.
  const testResponse = await Promise.any(awaitableResponses);
  if (testResponse.status === 401) {
    user.tokens = await refreshTokensOrRelogin(request, session, user.tokens);
    setSessionCookie(await getSessionToken(session));
    awaitableResponses = getResponses(user.tokens.accessToken);
  }

  return awaitableResponses;
};

export const authenticatedResolver = async (
  request: Request,
  fetchArgs: AtLeastOneFetch,
  options: LoginRedirectOptions = {}
) => {
  const resHeaders = new Headers({});
  const responses = await fetchAuthenticated(
    request,
    (cookie) => resHeaders.append("Set-Cookie", cookie),
    fetchArgs,
    options
  );

  return {
    responses,
    headers: resHeaders,
  };
};

export const defaultDataGetter = async <T = unknown>(
  responses: Promise<Response> | AtLeastOneAwaitableResponse
) => {
  const response = Array.isArray(responses) ? responses[0] : responses;
  return response.then(async (r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { body, isJson } = await tryJson<T>(r);

    if (r.ok) {
      return body as T;
    }
    logger.error(
      {
        status: r.status,
        url: r.url,
        data: body,
      },
      "Request failed with code: " + r.status
    );

    if (isJson) {
      throw Response.json(body, { status: r.status });
    }

    throw new Response((body as string) ?? r.statusText, { status: r.status });
  });
};

export const authenticatedData = <T>(
  request: Request,
  fetchArgs: AtLeastOneFetch,
  {
    getData = defaultDataGetter,
    ...passThroughOptions
  }: LoginRedirectOptions & {
    getData?: (responses: AtLeastOneAwaitableResponse) => Promise<T>;
  } = {}
) => {
  const initData = (async () => {
    const { responses, headers } = await authenticatedResolver(
      request,
      fetchArgs,
      passThroughOptions
    );
    return data(await getData(responses), { headers });
  })();

  return new DataResponse<T>((resolve) => resolve(initData));
};

interface AllCrudActions<
  T,
  TCreateSchema extends z.ZodType,
  TUpdateSchema extends z.ZodType,
  TCreateReturn = T,
  TUpdateReturn = T
> {
  list: (
    request: Request,
    query?: QueryParams,
    options?: FetchBuildOptions
  ) => DataResponse<ResultsPage<T>>;
  get: (
    request: Request,
    id: string,
    options?: FetchBuildOptions
  ) => DataResponse<T>;
  create: (
    request: Request,
    input: z.infer<TCreateSchema>,
    options?: FetchBuildOptions
  ) => DataResponse<TCreateReturn>;
  update: (
    request: Request,
    id: string,
    input: z.infer<TUpdateSchema>,
    options?: FetchBuildOptions
  ) => DataResponse<TUpdateReturn>;
  delete: (
    request: Request,
    id: string,
    options?: FetchBuildOptions
  ) => DataResponse<unknown>;
  deleteAndRedirect: (
    request: Request,
    id: string,
    to: string,
    options?: FetchBuildOptions
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
  TUpdateSchema extends z.ZodType,
  TCreateReturn = T,
  TUpdateReturn = T
>(
  path: string
): AllCrudActions<
  T,
  TCreateSchema,
  TUpdateSchema,
  TCreateReturn,
  TUpdateReturn
> {
  const actions = [...CrudActionNames];
  return actions.reduce((acc, action) => {
    switch (action) {
      case "list":
        acc[action] = (
          request: Request,
          query: QueryParams = {},
          options: FetchBuildOptions = {}
        ) => {
          return authenticatedData<ResultsPage<T>>(request, [
            FetchOptions.url(path, {
              order: {
                createdOn: "desc",
              },
              ...query,
            }).build(options),
          ]);
        };
        break;
      case "get":
        acc[action] = (
          request: Request,
          id: string,
          options: FetchBuildOptions = {}
        ) => {
          return authenticatedData<T>(request, [
            FetchOptions.url(`${path}/:id`, { id }).build(options),
          ]);
        };
        break;
      case "create":
        acc[action] = (
          request: Request,
          input: z.infer<TCreateSchema>,
          options: FetchBuildOptions = {}
        ) => {
          return authenticatedData<TCreateReturn>(request, [
            FetchOptions.url(path, options.params)
              .post()
              .json(input)
              .build(options),
          ]);
        };
        break;
      case "update":
        acc[action] = (
          request: Request,
          id: string,
          input: z.infer<TUpdateSchema>,
          options: FetchBuildOptions = {}
        ) => {
          return authenticatedData<TUpdateReturn>(request, [
            FetchOptions.url(`${path}/:id`, { id, ...options.params })
              .patch()
              .json(input)
              .build(options),
          ]);
        };
        break;
      case "delete":
        acc[action] = (
          request: Request,
          id: string,
          options: FetchBuildOptions = {}
        ) => {
          return authenticatedData(request, [
            FetchOptions.url(`${path}/:id`, { id }).delete().build(options),
          ]);
        };
        break;
      case "deleteAndRedirect":
        acc[action] = (
          request: Request,
          id: string,
          to: string,
          options: FetchBuildOptions = {}
        ) => {
          return authenticatedData(request, [
            FetchOptions.url(`${path}/:id`, { id }).delete().build(options),
          ]).asRedirect(to);
        };
        break;
      default:
        break;
    }

    return acc;
  }, {} as AllCrudActions<T, TCreateSchema, TUpdateSchema, TCreateReturn, TUpdateReturn>);
}

export class CRUD<
  T,
  TCreateSchema extends z.ZodType,
  TUpdateSchema extends z.ZodType,
  TCreateReturn = T,
  TUpdateReturn = T
> {
  constructor(private path: string) {}

  public static for<
    T,
    TCreateSchema extends z.ZodType,
    TUpdateSchema extends z.ZodType,
    TCreateReturn = T,
    TUpdateReturn = T
  >(path: string) {
    return new CRUD<
      T,
      TCreateSchema,
      TUpdateSchema,
      TCreateReturn,
      TUpdateReturn
    >(path);
  }

  public all() {
    return buildCrud<
      T,
      TCreateSchema,
      TUpdateSchema,
      TCreateReturn,
      TUpdateReturn
    >(this.path);
  }

  public only<TActions extends CrudActionName[]>(actions: TActions) {
    return Object.fromEntries(
      Object.entries(this.all()).filter(([action]) =>
        actions.includes(action as CrudActionName)
      )
    ) as Pick<
      AllCrudActions<
        T,
        TCreateSchema,
        TUpdateSchema,
        TCreateReturn,
        TUpdateReturn
      >,
      TActions[number]
    >;
  }

  public except<TActions extends CrudActionName[]>(actions: TActions) {
    return Object.fromEntries(
      Object.entries(this.all()).filter(
        ([action]) => !actions.includes(action as CrudActionName)
      )
    ) as Omit<
      AllCrudActions<
        T,
        TCreateSchema,
        TUpdateSchema,
        TCreateReturn,
        TUpdateReturn
      >,
      TActions[number]
    >;
  }
}
