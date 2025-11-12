import { AsyncLocalStorage } from "node:async_hooks";
import { UNSAFE_ErrorResponseImpl, type MiddlewareFunction } from "react-router";

interface CookieStore {
  requestId: number;
  cookieHeader: string;
  outgoingCookies: Record<string, string>;
}

let idSeq = 0;
const cookieStorage = new AsyncLocalStorage<CookieStore>();

const createCookieStoreMiddleware =
  (): MiddlewareFunction<Response> =>
  async ({ request }, next) => {
    if (!cookieStorage.getStore()) {
      const requestId = ++idSeq;
      const cookieHeader = request.headers.get("cookie") ?? "";

      return await new Promise<Awaited<ReturnType<typeof next>>>((resolve, reject) =>
        cookieStorage.run({ requestId, cookieHeader, outgoingCookies: {} }, async () => {
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
