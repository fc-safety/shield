import { data } from "react-router";
import type { z } from "zod";
import type {
  Asset,
  Client,
  Manufacturer,
  Product,
  ResultsPage,
  Site,
} from "~/lib/models";
import type {
  createAssetSchema,
  createClientSchema,
  createSiteSchema,
  updateAssetSchema,
  updateClientSchema,
  updateSiteSchema,
} from "~/lib/schema";
import { API_BASE_URL } from "./config";
import { logger } from "./logger";
import { requireUserSession } from "./sessions";

type FetchParameters = Parameters<typeof fetch>;
type FetchOptions = {
  url: FetchParameters[0];
  options?: FetchParameters[1];
};
type AtLeastOneFetch = [FetchOptions, ...FetchOptions[]];
type AtLeastOneAwaitableResponse = [Promise<Response>, ...Promise<Response>[]];
export const fetchAuthenticated = async (
  request: Request,
  setSessionCookie: (cookie: string) => void,
  ...fetchArgs: AtLeastOneFetch
) => {
  const { user, sessionToken } = await requireUserSession(request);
  setSessionCookie(sessionToken);

  return fetchArgs.map(async ({ url, options = {} }) => {
    const headers = new Headers({
      ...options?.headers,
      Authorization: `Bearer ${user.tokens.accessToken}`,
    });
    options.headers = headers;

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

const defaultDataGetter = async (
  responses: Promise<Response> | AtLeastOneAwaitableResponse
) => {
  const response = Array.isArray(responses) ? responses[0] : responses;
  return response.then(async (r) => {
    if (r.ok) {
      return r.json();
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

// ----------------------------------------------------------------------------
// ---------------------------- ASSETS -----------------------------------------
// ----------------------------------------------------------------------------

export const getAssets = async (
  request: Request,
  query?: Record<string, string | number>
) => {
  return authenticatedData<ResultsPage<Asset>>(request, [
    {
      url: buildUrl("assets", query),
    },
  ]);
};

export const getAssetsStateData = async (
  request: Request,
  options: {
    productsQuery?: Record<string, string | number>;
  } = {}
) => {
  return authenticatedData<{
    products: Promise<Product[]>;
  }>(
    request,
    [
      {
        url: buildUrl("products", { ...options.productsQuery, limit: 10000 }),
      },
    ],
    async ([productsRes]) => {
      const products = productsRes.then((r) => r.json()).then((r) => r.results);
      return {
        products,
      };
    }
  );
};

export const getAsset = async (request: Request, id: string) => {
  return authenticatedData<Asset>(request, [
    { url: buildUrl("assets/:id", { id }) },
  ]);
};

export const createAsset = async (
  request: Request,
  asset: z.infer<typeof createAssetSchema>
) => {
  return authenticatedData<Asset>(request, [
    {
      url: buildUrl("assets"),
      options: {
        method: "POST",
        body: JSON.stringify(asset),
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  ]);
};

export const updateAsset = async (
  request: Request,
  id: string,
  asset: z.infer<typeof updateAssetSchema>
) => {
  return authenticatedData<Asset>(request, [
    {
      url: buildUrl("assets/:id", { id }),
      options: {
        method: "PATCH",
        body: JSON.stringify(asset),
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  ]);
};

export const deleteAsset = async (request: Request, id: string) => {
  return authenticatedData<Asset>(request, [
    {
      url: buildUrl("assets/:id", { id }),
      options: {
        method: "DELETE",
      },
    },
  ]);
};

// ----------------------------------------------------------------------------
// ---------------------------- PRODUCTS --------------------------------------
// ----------------------------------------------------------------------------

export const getManufacturers = async (
  request: Request,
  query: Record<string, string | number> = {}
) => {
  return authenticatedData<ResultsPage<Manufacturer>>(request, [
    {
      url: buildUrl("manufacturers", query),
    },
  ]);
};

// ----------------------------------------------------------------------------
// ---------------------------- CLIENTS ---------------------------------------
// ----------------------------------------------------------------------------

export const getClients = async (
  request: Request,
  query: Record<string, string | number> = {}
) => {
  return authenticatedData<ResultsPage<Client>>(request, [
    {
      url: buildUrl("clients", query),
    },
  ]);
};

export const getClient = async (request: Request, id: string) => {
  return authenticatedData<Client>(request, [
    {
      url: buildUrl("clients/:id", { id }),
    },
  ]);
};

export const createClient = async (
  request: Request,
  client: z.infer<typeof createClientSchema>
) => {
  return authenticatedData<Client>(request, [
    {
      url: buildUrl("clients"),
      options: {
        method: "POST",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  ]);
};

export const updateClient = async (
  request: Request,
  id: string,
  client: z.infer<typeof updateClientSchema>
) => {
  return authenticatedData<Client>(request, [
    {
      url: buildUrl("clients/:id", { id }),
      options: {
        method: "PATCH",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  ]);
};

export const deleteClient = async (request: Request, id: string) => {
  return authenticatedData<Client>(request, [
    {
      url: buildUrl("clients/:id", { id }),
      options: {
        method: "DELETE",
      },
    },
  ]);
};

// Sites

export const getSite = async (request: Request, id: string) => {
  return authenticatedData<Site>(request, [
    {
      url: buildUrl("sites/:id", { id }),
    },
  ]);
};

export const createSite = async (
  request: Request,
  site: z.infer<typeof createSiteSchema>
) => {
  return authenticatedData<Site>(request, [
    {
      url: buildUrl("sites"),
      options: {
        method: "POST",
        body: JSON.stringify(site),
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  ]);
};

export const updateSite = async (
  request: Request,
  id: string,
  site: z.infer<typeof updateSiteSchema>
) => {
  return authenticatedData<Site>(request, [
    {
      url: buildUrl("sites/:id", { id }),
      options: {
        method: "PATCH",
        body: JSON.stringify(site),
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  ]);
};

export const deleteSite = async (request: Request, id: string) => {
  return authenticatedData<Site>(request, [
    {
      url: buildUrl("sites/:id", { id }),
      options: {
        method: "DELETE",
      },
    },
  ]);
};
