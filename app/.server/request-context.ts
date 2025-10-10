import { produce, type Draft } from "immer";
import { AsyncLocalStorage } from "node:async_hooks";
import { UNSAFE_ErrorResponseImpl, type MiddlewareFunction } from "react-router";

interface RequestContext {
  requestId: number;
  setCookieHeaderValues: Record<string, string>;
}

declare global {
  var REQUEST_CONTEXT: AsyncLocalStorage<RequestContext>;
}

// Initialize the AsyncLocalStorage if it doesn't exist
globalThis.REQUEST_CONTEXT = globalThis.REQUEST_CONTEXT ?? new AsyncLocalStorage<RequestContext>();

let idSeq = 0;

export const createRequestContext = async (next: Parameters<MiddlewareFunction<Response>>[1]) => {
  const requestStorage = globalThis.REQUEST_CONTEXT;
  if (!requestStorage.getStore()) {
    const res = await new Promise<Awaited<ReturnType<typeof next>>>((resolve, reject) =>
      requestStorage.run({ requestId: idSeq++, setCookieHeaderValues: {} }, async () => {
        try {
          const res = await next();
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
    return res;
  } else {
    return await next();
  }
};

const getStoreOrThrow = () => {
  const requestStorage = globalThis.REQUEST_CONTEXT;
  const store = requestStorage.getStore();
  if (!store) {
    throw new Error("Request context not found");
  }
  return store;
};

export const requestContext = {
  create: createRequestContext,
  getContext: getStoreOrThrow,
  get: <K extends keyof RequestContext>(key: K) => {
    return getStoreOrThrow()[key];
  },
  set: <K extends keyof RequestContext>(
    key: K,
    value: RequestContext[K] | ((draft: Draft<RequestContext[K]>) => void)
  ) => {
    const store = getStoreOrThrow();
    if (typeof value === "function") {
      store[key] = produce(store[key], value);
    } else {
      store[key] = value;
    }
  },
  delete: <K extends keyof RequestContext>(key: K) => {
    delete getStoreOrThrow()[key];
  },
};

export const setCookieHeaderValue = (key: string, value: string) => {
  requestContext.set("setCookieHeaderValues", (draft) => {
    draft[key] = value;
  });
};

export const clearCookieHeaderValue = (key: string) => {
  requestContext.set("setCookieHeaderValues", (draft) => {
    Reflect.deleteProperty(draft, key);
  });
};
