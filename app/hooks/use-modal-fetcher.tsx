import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import type { ViewContext } from "~/.server/api-utils";
import { buildErrorDisplay } from "~/lib/error-handling";
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

  const submit = (...args: Parameters<typeof fetcher.submit>) => {
    errorReported.current = false;
    setIsSubmitting(true);
    dataCaptured.current = false;
    fetcher.submit(...args);
  };

  const rawLoad = useCallback(
    (...args: Parameters<typeof fetcher.load>) => {
      if (fetcher.state !== "idle") return;
      errorReported.current = false;
      dataCaptured.current = false;
      fetcher.load(...args);
    },
    [fetcher]
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

  const submitJson = (
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
  };

  const createOrUpdateJson = (
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
  };

  useEffect(() => {
    if (
      fetcher.data !== undefined &&
      fetcher.state === "idle" &&
      !dataCaptured.current
    ) {
      dataCaptured.current = true;
      onData?.(fetcher.data as T);
      if (fetcher.data.error) {
        if (!errorReported.current) {
          errorReported.current = true;
          toast.error(
            buildErrorDisplay(fetcher.data.error, {
              defaultErrorMessage,
            }),
            {
              duration: 5000,
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
