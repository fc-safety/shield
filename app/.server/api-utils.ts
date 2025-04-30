import { data } from "react-router";
import type { ResultsPage } from "~/lib/models";
import { buildUrl, type PathParams, type QueryParams } from "~/lib/urls";
import { config } from "./config";
import { logger } from "./logger";
import { requestContext } from "./request-context";
import {
  refreshTokensOrRelogin,
  requireUserSession,
  type LoginRedirectOptions,
} from "./sessions";

export const ResourceBasePaths = {
  assets: "/assets",
  alerts: "/alerts",
  tags: "/tags",
  inspections: "/inspections",
  inspectionRoutes: "/inspection-routes",
  productRequests: "/product-requests",
  products: "/products",
  manufacturers: "/manufacturers",
  productCategories: "/product-categories",
  ansiCategories: "/ansi-categories",
  clients: "/clients",
  users: "/users",
  sites: "/sites",
  roles: "/roles",
  settings: "/settings",
  vaultOwnerships: "/vault-ownerships",
  reports: "/reports",
};

type ResourceKey = keyof typeof ResourceBasePaths;

type NativeFetchParameters = Parameters<typeof fetch>;
type FetchArguments = {
  url: NativeFetchParameters[0];
  options?: NativeFetchParameters[1];
};

const VIEW_CONTEXTS = ["admin", "user"] as const;
export type ViewContext = (typeof VIEW_CONTEXTS)[number];

export type FetchBuildOptions = {
  context?: ViewContext;
  params?: QueryParams;
  headers?: HeadersInit;
};

export class FetchOptions {
  private url: NativeFetchParameters[0];
  private options: NonNullable<NativeFetchParameters[1]> & {
    headers: Headers;
  };
  private singleResourceKey: string | undefined = undefined;

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

  public static resources = Object.fromEntries(
    Object.entries(ResourceBasePaths).map(([key, resourceBasePath]) => [
      key,
      () => new FetchOptions(buildUrl(resourceBasePath, config.API_BASE_URL)),
    ])
  ) as Record<ResourceKey, () => FetchOptions>;

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

  public byKey(key: string) {
    this.singleResourceKey = key;
    return this;
  }

  public byId(id: string) {
    return this.byKey(id);
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

  public setHeaders(headers: HeadersInit) {
    this.options.headers = new Headers(headers);
    return this;
  }

  public setHeader(key: string, value: string) {
    this.options.headers.set(key, value);
    return this;
  }

  public appendHeader(key: string, value: string) {
    this.options.headers.append(key, value);
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

    const newHeaders = new Headers(this.options.headers);
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
    }

    if (this.singleResourceKey) {
      this.addResourceKeyToUrl(this.singleResourceKey);
    }

    return {
      url: this.url,
      options: this.options,
    };
  }

  private addResourceKeyToUrl(key: string) {
    const addIdToPath = (url: URL, id: string) => {
      const path = url.pathname;
      const newPath = `${path.replace(/\/$/, "")}/${id}`;
      url.pathname = newPath;
      return url;
    };

    if (typeof this.url === "string") {
      this.url = addIdToPath(new URL(this.url), key).toString();
    } else if (this.url instanceof URL) {
      this.url = addIdToPath(new URL(this.url), key);
    } else {
      throw new Error("Cannot modify path of read-only Request URL");
    }
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

export const catchResponse = async <T>(
  dataPromise: Promise<T>,
  options: {
    /** Only catch responses with these status codes. */
    codes?: number[];
  } = {}
): Promise<ReturnType<typeof data<DataOrError<T>>>> => {
  return dataPromise
    .then((gotData) => data({ data: gotData }))
    .catch(async (errorOrResponse) => {
      let status: number = 500;
      let error: unknown = null;

      if (errorOrResponse instanceof Response) {
        if (options.codes && !options.codes.includes(errorOrResponse.status)) {
          throw errorOrResponse;
        }
        error = await tryJson(errorOrResponse).then(({ body }) => body);
        status = errorOrResponse.status;
      } else if (errorOrResponse instanceof Error) {
        error = errorOrResponse.message;
        logger.error(errorOrResponse);
      } else {
        error = errorOrResponse;
      }

      return data({ error }, { status });
    });
};

type AtLeastOneFetch = [FetchArguments, ...FetchArguments[]];
type AtLeastOneAwaitableResponse = [Promise<Response>, ...Promise<Response>[]];
export const fetchAuthenticated = async (
  request: Request,
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

    const sessionToken = await getSessionToken(session);
    requestContext.set("setCookieHeaderValues", (values) => ({
      ...values,
      authSession: sessionToken,
    }));

    awaitableResponses = getResponses(user.tokens.accessToken);
  }

  return awaitableResponses;
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

export const getAuthenticatedData = async <T>(
  request: Request,
  fetchArgs: AtLeastOneFetch,
  {
    getData = defaultDataGetter,
    ...passThroughOptions
  }: LoginRedirectOptions & {
    getData?: (responses: AtLeastOneAwaitableResponse) => Promise<T>;
  } = {}
) => {
  const responses = await fetchAuthenticated(
    request,
    fetchArgs,
    passThroughOptions
  );
  return await getData(responses);
};

export const getManyAuthenticatedData = async <
  TMany extends readonly unknown[]
>(
  request: Request,
  fetchArgs: AtLeastOneFetch,
  passThroughOptions: LoginRedirectOptions = {}
) => {
  const responses = await fetchAuthenticated(
    request,
    fetchArgs,
    passThroughOptions
  );
  return responses.map(defaultDataGetter) as {
    [key in keyof TMany]: ReturnType<typeof defaultDataGetter<TMany[key]>>;
  };
};

export const getAllAuthenticatedData = async <TMany extends readonly unknown[]>(
  request: Request,
  fetchArgs: AtLeastOneFetch,
  passThroughOptions: LoginRedirectOptions = {}
) => {
  return await Promise.all(
    await getManyAuthenticatedData<TMany>(
      request,
      fetchArgs,
      passThroughOptions
    )
  );
};

export const getAllSettledAuthenticatedData = async <
  TMany extends readonly unknown[]
>(
  request: Request,
  fetchArgs: AtLeastOneFetch,
  passThroughOptions: LoginRedirectOptions = {}
) => {
  return await Promise.allSettled(
    await getManyAuthenticatedData<TMany>(
      request,
      fetchArgs,
      passThroughOptions
    )
  );
};

interface AllCrudActions<T> {
  list: (
    request: Request,
    query?: QueryParams,
    options?: FetchBuildOptions
  ) => Promise<ResultsPage<T>>;
  get: (
    request: Request,
    id: string,
    options?: FetchBuildOptions
  ) => Promise<T>;
}

type CrudActionName = keyof AllCrudActions<unknown>;
const CrudActionNames: CrudActionName[] = ["list", "get"];

function buildCrud<T>(path: string): AllCrudActions<T> {
  const actions = [...CrudActionNames];
  return actions.reduce((acc, action) => {
    switch (action) {
      case "list":
        acc[action] = (
          request: Request,
          query: QueryParams = {},
          options: FetchBuildOptions = {}
        ) => {
          return getAuthenticatedData<ResultsPage<T>>(request, [
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
          return getAuthenticatedData<T>(request, [
            FetchOptions.url(`${path}/:id`, { id }).build(options),
          ]);
        };
        break;
      default:
        break;
    }

    return acc;
  }, {} as AllCrudActions<T>);
}

export class CRUD<T> {
  constructor(private path: string) {}

  public static for<T>(path: string) {
    return new CRUD<T>(path);
  }

  public all() {
    return buildCrud<T>(this.path);
  }

  public only<TActions extends CrudActionName[]>(actions: TActions) {
    return Object.fromEntries(
      Object.entries(this.all()).filter(([action]) =>
        actions.includes(action as CrudActionName)
      )
    ) as Pick<AllCrudActions<T>, TActions[number]>;
  }

  public except<TActions extends CrudActionName[]>(actions: TActions) {
    return Object.fromEntries(
      Object.entries(this.all()).filter(
        ([action]) => !actions.includes(action as CrudActionName)
      )
    ) as Omit<AllCrudActions<T>, TActions[number]>;
  }
}
