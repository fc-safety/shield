import { data } from "react-router";
import type { ResultsPage } from "~/lib/models";
import {
  buildUrl,
  isAbsoluteUrl,
  stringifyQuery,
  type PathParams,
  type QueryParams,
} from "~/lib/urls";
import { config } from "./config";
import { logger } from "./logger";
import {
  commitUserSession,
  refreshTokensOrRelogin,
  requireUserSession,
  type LoginRedirectOptions,
} from "./user-sesssion";

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

const VIEW_CONTEXTS = ["admin", "user"] as const;
export type ViewContext = (typeof VIEW_CONTEXTS)[number];

export type FetchBuildOptions = {
  context?: ViewContext;
  /** Client ID for multi-client access. Sets X-Client-Id header. */
  clientId?: string;
  params?: QueryParams;
  headers?: HeadersInit;
  method?: NonNullable<NativeFetchParameters[1]>["method"];
  raw?: boolean;
};

export class FetchOptions {
  private url: NativeFetchParameters[0];
  private options: NonNullable<NativeFetchParameters[1]> & {
    headers: Headers;
  };
  private singleResourceKey: string | undefined = undefined;

  constructor(url: NativeFetchParameters[0], options: NativeFetchParameters[1] = {}) {
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

  public static create(url: NativeFetchParameters[0], options?: NativeFetchParameters[1]) {
    return new FetchOptions(url, options);
  }

  public static url<TPath extends string>(path: TPath, params?: QueryParams & PathParams<TPath>) {
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

  public setQueryParams(params: QueryParams) {
    this.modifyUrl((url) => {
      url.search = `?${stringifyQuery(params)}`;
      return url;
    });
    return this;
  }

  public addQueryParams(params: QueryParams) {
    this.modifyUrl((url) => {
      const newParams = new URLSearchParams(stringifyQuery(params));
      newParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
      return url;
    });
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public json(body: any) {
    this.options.body = JSON.stringify(body);
    this.options.headers.set("Content-Type", "application/json");
    return this;
  }

  public body(body: BodyInit | null | undefined) {
    this.options.body = body;
    return this;
  }

  public build(options: FetchBuildOptions = {}) {
    if (options.method) {
      this.options.method = options.method;
    }

    if (options.context) {
      this.options.headers.set("X-View-Context", options.context);
    }

    if (options.clientId) {
      this.options.headers.set("X-Client-Id", options.clientId);
    }

    if (options.headers) {
      const newHeaders = new Headers(this.options.headers);
      Object.entries(options.headers).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      this.options.headers = newHeaders;
    }

    if (options.params) {
      this.addQueryParams(options.params);
    }

    if (this.singleResourceKey) {
      this.addResourceKeyToUrl(this.singleResourceKey);
    }

    if (!options.raw) {
      this.options.headers.set("Accept", "application/json");
    }

    return {
      url: this.url,
      options: this.options,
    };
  }

  private addResourceKeyToUrl(key: string) {
    this.modifyUrl((url) => {
      const path = url.pathname;
      const newPath = `${path.replace(/\/$/, "")}/${key}`;
      url.pathname = newPath;
      return url;
    });
  }

  private modifyUrl(action: (url: URL) => URL) {
    if (typeof this.url === "string") {
      this.url = action(new URL(this.url)).toString();
    } else if (this.url instanceof URL) {
      this.url = action(this.url);
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
        // Redirects must be rethrown so the application can handle them.
        if (errorOrResponse.status >= 300 && errorOrResponse.status < 400) {
          throw errorOrResponse;
        }

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

export const fetchAuthenticated = async (
  request: Request,
  url: Parameters<typeof fetch>[0],
  fetchOptions: Parameters<typeof fetch>[1] = {},
  authOptions: LoginRedirectOptions = {}
) => {
  const { user, session } = await requireUserSession(request, authOptions);

  const getResponse = (accessToken: string) => {
    fetchOptions.headers = new Headers(fetchOptions?.headers);
    fetchOptions.headers.set("Authorization", `Bearer ${accessToken}`);

    return fetch(url, fetchOptions);
  };

  let response = await getResponse(user.tokens.accessToken);

  // Peek at the first response returned to see if it's a 401.
  // This is the most efficient way to find out if the token is still active.
  // For the majority of requests, the status will be 200, and we can bypass
  // any other token validation. Only on a 401 do we take the time to refresh
  // or reinitiate login.
  if (response.status === 401) {
    user.tokens = await refreshTokensOrRelogin(request, session, user.tokens);

    // Update session using request context middleware.
    await commitUserSession(session);

    response = await getResponse(user.tokens.accessToken);
  }

  return response;
};

export const defaultDataGetter = async <T = unknown>(response: Promise<Response>) => {
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

    const status = r.status >= 500 ? 500 : r.status;

    if (isJson) {
      throw Response.json(body, { status });
    }

    throw new Response((body as string) ?? r.statusText, { status });
  });
};

export const getAuthenticatedData = async <T>(
  request: Request,
  url: Parameters<typeof fetch>[0],
  fetchOptions: Parameters<typeof fetch>[1] = {},
  {
    getData = defaultDataGetter,
    ...passThroughOptions
  }: LoginRedirectOptions & {
    getData?: (response: Promise<Response>) => Promise<T>;
  } = {}
) => {
  const awaitableResponse = fetchAuthenticated(request, url, fetchOptions, passThroughOptions);
  return await getData(awaitableResponse);
};

interface ApiFetcherOptions<T> extends FetchBuildOptions, LoginRedirectOptions {
  getData?: (response: Promise<Response>) => Promise<T>;
  bypassAuth?: boolean;
}

export class ApiFetcher {
  private request: Request;
  private fetchOptionsBuilder: FetchOptions;

  constructor(request: Request, fetchOptionsBuilder: FetchOptions) {
    this.request = request;
    this.fetchOptionsBuilder = fetchOptionsBuilder;
  }

  public static create(request: Request, url: Parameters<typeof fetch>[0]): ApiFetcher;
  public static create<TPath extends string>(
    request: Request,
    path: TPath,
    params?: QueryParams & PathParams<TPath>
  ): ApiFetcher;
  public static create<T, TPath extends string>(
    request: Request,
    urlOrPath: Parameters<typeof fetch>[0] | TPath,
    params?: QueryParams & PathParams<TPath>
  ) {
    if (typeof urlOrPath === "string" && !isAbsoluteUrl(urlOrPath)) {
      return new ApiFetcher(request, FetchOptions.url(urlOrPath, params));
    }
    return new ApiFetcher(request, FetchOptions.create(urlOrPath));
  }

  public fetch<T>(options: ApiFetcherOptions<T> = {}) {
    const { url, options: fetchOptions } = this.fetchOptionsBuilder.build(options);
    if (options.bypassAuth) {
      const getData = options.getData ?? defaultDataGetter;
      return getData(fetch(url, fetchOptions));
    }
    return getAuthenticatedData<T>(this.request, url, fetchOptions, options);
  }

  public get<T>(options?: ApiFetcherOptions<T>) {
    this.fetchOptionsBuilder.get();
    return this.fetch<T>(options);
  }

  public post<T>(options?: ApiFetcherOptions<T>) {
    this.fetchOptionsBuilder.post();
    return this.fetch<T>(options);
  }

  public patch<T>(options?: ApiFetcherOptions<T>) {
    this.fetchOptionsBuilder.patch();
    return this.fetch<T>(options);
  }

  public delete<T>(options?: ApiFetcherOptions<T>) {
    this.fetchOptionsBuilder.delete();
    return this.fetch<T>(options);
  }

  public setHeaders(headers: HeadersInit) {
    this.fetchOptionsBuilder.setHeaders(headers);
    return this;
  }

  public setHeader(key: string, value: string) {
    this.fetchOptionsBuilder.setHeader(key, value);
    return this;
  }

  public appendHeader(key: string, value: string) {
    this.fetchOptionsBuilder.appendHeader(key, value);
    return this;
  }

  public setQueryParams(params: QueryParams) {
    this.fetchOptionsBuilder.setQueryParams(params);
    return this;
  }

  public addQueryParams(params: QueryParams) {
    this.fetchOptionsBuilder.addQueryParams(params);
    return this;
  }

  public json(body: unknown) {
    this.fetchOptionsBuilder.json(body);
    return this;
  }

  public body(body: BodyInit | null | undefined) {
    this.fetchOptionsBuilder.body(body);
    return this;
  }
}

export const getAuthenticatedFetcher =
  <T>(request: Request, { throwOnError = true }: { throwOnError?: boolean } = {}) =>
  async (...args: Parameters<typeof fetch>) => {
    const [urlOrPath, options] = args;

    let url = urlOrPath;
    if (typeof urlOrPath === "string" && !isAbsoluteUrl(urlOrPath)) {
      url = buildUrl(urlOrPath, config.API_BASE_URL);
    }
    const response = await fetchAuthenticated(request, url, options);
    if (throwOnError && !response.ok) {
      throw response;
    }
    return response;
  };

interface AllCrudActions<T> {
  list: (
    request: Request,
    query?: QueryParams,
    options?: FetchBuildOptions
  ) => Promise<ResultsPage<T>>;
  get: (request: Request, id: string, options?: FetchBuildOptions) => Promise<T>;
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
        ) =>
          ApiFetcher.create(request, path, {
            order: {
              createdOn: "desc",
            },
            ...query,
          }).get<ResultsPage<T>>(options);
        break;
      case "get":
        acc[action] = (request: Request, id: string, options: FetchBuildOptions = {}) =>
          ApiFetcher.create(request, `${path}/:id`, {
            id,
          }).get<T>(options);
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
      Object.entries(this.all()).filter(([action]) => actions.includes(action as CrudActionName))
    ) as Pick<AllCrudActions<T>, TActions[number]>;
  }

  public except<TActions extends CrudActionName[]>(actions: TActions) {
    return Object.fromEntries(
      Object.entries(this.all()).filter(([action]) => !actions.includes(action as CrudActionName))
    ) as Omit<AllCrudActions<T>, TActions[number]>;
  }
}
