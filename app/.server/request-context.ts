import { AsyncLocalStorage } from "node:async_hooks";
import type { unstable_MiddlewareFunction } from "react-router";

interface RequestContext {
  requestId: number;
  setCookieHeaderValues: Record<string, string>;
}

declare global {
  var REQUEST_CONTEXT: AsyncLocalStorage<RequestContext>;
}

// Initialize the AsyncLocalStorage if it doesn't exist
globalThis.REQUEST_CONTEXT =
  globalThis.REQUEST_CONTEXT ?? new AsyncLocalStorage<RequestContext>();

let idSeq = 0;

export const createRequestContext: unstable_MiddlewareFunction = async (
  { request, params, context },
  next
) => {
  const requestStorage = globalThis.REQUEST_CONTEXT;
  if (!requestStorage.getStore()) {
    const res = await new Promise<Awaited<ReturnType<typeof next>>>((resolve) =>
      requestStorage.run(
        { requestId: idSeq++, setCookieHeaderValues: {} },
        async () => {
          const res = await next();
          resolve(res);
        }
      )
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
    value:
      | RequestContext[K]
      | ((current: RequestContext[K]) => RequestContext[K])
  ) => {
    const store = getStoreOrThrow();
    if (typeof value === "function") {
      store[key] = value(store[key]);
    } else {
      store[key] = value;
    }
  },
  delete: <K extends keyof RequestContext>(key: K) => {
    delete getStoreOrThrow()[key];
  },
};
