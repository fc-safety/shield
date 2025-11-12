import { AsyncLocalStorage } from "node:async_hooks";
import { UNSAFE_ErrorResponseImpl, type MiddlewareFunction } from "react-router";

interface CookieStore {
  cookieHeader: string;
  outgoingCookies: Record<string, string>;
}

declare global {
  var COOKIE_STORE: AsyncLocalStorage<CookieStore>;
}

// Initialize the AsyncLocalStorage if it doesn't exist
globalThis.COOKIE_STORE = globalThis.COOKIE_STORE ?? new AsyncLocalStorage<CookieStore>();

const createCookieStoreMiddleware =
  (): MiddlewareFunction<Response> =>
  async ({ request }, next) => {
    const cookieStorage = globalThis.COOKIE_STORE;
    if (!cookieStorage.getStore()) {
      const cookieHeader = request.headers.get("cookie") ?? "";

      return await new Promise<Awaited<ReturnType<typeof next>>>((resolve, reject) =>
        cookieStorage.run({ cookieHeader, outgoingCookies: {} }, async () => {
          try {
            const res = await next();

            const store = cookieStorage.getStore();
            if (store) {
              for (const c of Object.values(store.outgoingCookies)) {
                res.headers.append("Set-Cookie", c);
              }
            }

            resolve(res);
          } catch (error) {
            if (error instanceof UNSAFE_ErrorResponseImpl) {
              resolve(error as unknown as Response);
            } else {
              reject(error);
            }
          }
        })
      );
    } else {
      return await next();
    }
  };

const getStoreOrThrow = () => {
  const cookieStorage = globalThis.COOKIE_STORE;
  const store = cookieStorage.getStore();
  if (!store) {
    throw new Error("Cookie store not found. Make sure to call createCookieStore() first.");
  }
  return store;
};

export const cookieStore = {
  createMiddleware: createCookieStoreMiddleware,
  getContext: getStoreOrThrow,
  get: (key: string): string | undefined => {
    return getStoreOrThrow().outgoingCookies[key];
  },
  set: (key: string, cookie: string) => {
    const store = getStoreOrThrow();
    store.outgoingCookies[key] = cookie;
  },
  unset: (key: string) => {
    const store = getStoreOrThrow();
    Reflect.deleteProperty(store.outgoingCookies, key);
  },
  has: (key: string): boolean => {
    const store = getStoreOrThrow();
    return key in store.outgoingCookies;
  },
  getCookieHeader: (): string => {
    return getStoreOrThrow().cookieHeader;
  },
};
