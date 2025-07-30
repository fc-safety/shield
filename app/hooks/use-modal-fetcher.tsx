import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import type { ViewContext } from "~/.server/api-utils";
import { buildErrorDisplay } from "~/lib/error-handling";
import { cleanErrorMessage } from "~/lib/errors";
import { buildPath, type QueryParams } from "~/lib/urls";

export function useModalFetcher<T>({
  onSubmitted,
  onData,
  defaultErrorMessage,
}: {
  onSubmitted?: () => void;
  onData?: (data: T) => void;
  defaultErrorMessage?: string;
} = {}) {
  const fetcher = useFetcher();
  const errorReported = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dataCaptured = useRef(false);

  const submit = useCallback(
    (...args: Parameters<typeof fetcher.submit>) => {
      errorReported.current = false;
      setIsSubmitting(true);
      dataCaptured.current = false;
      fetcher.submit(...args);
    },
    [fetcher.submit]
  );

  const rawLoad = useCallback(
    (...args: Parameters<typeof fetcher.load>) => {
      if (fetcher.state !== "idle") return;
      errorReported.current = false;
      dataCaptured.current = false;
      fetcher.load(...args);
    },
    [fetcher.state, fetcher.load]
  );

  const load = useCallback(
    (options: { path: string; query?: QueryParams; throw?: boolean }) => {
      const cleanedPath = buildPath(options.path, {
        _throw: String(!!options.throw),
        ...options.query,
      });
      rawLoad(cleanedPath);
    },
    [rawLoad]
  );

  const submitJson = useCallback(
    (
      data: Parameters<typeof fetcher.submit>[0],
      options: {
        path: string;
        query?: QueryParams;
        throw?: boolean;
        method?: NonNullable<Parameters<typeof fetcher.submit>[1]>["method"];
        viewContext?: ViewContext;
      }
    ) => {
      const cleanedPath = buildPath(options.path, {
        _throw: String(!!options.throw),
        _viewContext: options.viewContext,
        ...options.query,
      });

      return submit(data, {
        method: options.method ?? "post",
        action: cleanedPath,
        encType: "application/json",
      });
    },
    [submit]
  );

  const createOrUpdateJson = useCallback(
    (
      data: Parameters<typeof fetcher.submit>[0],
      options: Parameters<typeof submitJson>[1] & {
        id?: string | null;
      }
    ) => {
      let cleanedPath = options.path;
      if (options.id) {
        cleanedPath = `${cleanedPath.replace(/\/+$/, "")}/${options.id}`;
      }

      return submitJson(data, {
        ...options,
        method: options.method ?? (options.id ? "patch" : "post"),
        path: cleanedPath,
      });
    },
    [submitJson]
  );

  useEffect(() => {
    if (fetcher.data !== undefined && fetcher.state === "idle" && !dataCaptured.current) {
      dataCaptured.current = true;
      onData?.(fetcher.data as T);
      if (fetcher.data.error) {
        if (!errorReported.current) {
          errorReported.current = true;
          toast.error(
            buildErrorDisplay(fetcher.data.error, {
              defaultErrorMessage:
                defaultErrorMessage ?? asString(cleanErrorMessage(fetcher.data.error)),
            }),
            {
              duration: 5000,
              icon: null,
            }
          );
        }
      } else {
        onSubmitted?.();
      }
      setIsSubmitting(false);
    }
  }, [fetcher.data, fetcher.state, onSubmitted, defaultErrorMessage, onData]);

  return {
    fetcher,
    submit,
    submitJson,
    createOrUpdateJson,
    isSubmitting,
    isLoading: fetcher.state !== "idle",
    load,
    data: fetcher.data as T | null,
  };
}

const asString = (strOrArray: string | string[]) => {
  if (Array.isArray(strOrArray)) {
    return strOrArray.join("\n");
  }
  return strOrArray;
};
