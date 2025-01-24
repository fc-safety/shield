import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { buildErrorDisplay } from "~/lib/error-handling";
import { buildPath, type QueryParams } from "~/lib/urls";

export function useModalSubmit({
  onSubmitted,
  defaultErrorMessage,
}: {
  onSubmitted?: () => void;
  defaultErrorMessage?: string;
} = {}) {
  const fetcher = useFetcher();
  const errorReported = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = (...args: Parameters<typeof fetcher.submit>) => {
    errorReported.current = false;
    setIsSubmitting(true);
    fetcher.submit(...args);
  };

  const createOrUpdateJson = (
    data: Parameters<typeof fetcher.submit>[0],
    options: {
      path: string;
      id: string | undefined | null;
      query?: QueryParams;
    }
  ) => {
    let cleanedPath = options.path;
    if (options.id) {
      cleanedPath = `${cleanedPath.replace(/\/+$/, "")}/${options.id}`;
    }
    if (options.query) {
      cleanedPath = buildPath(cleanedPath, options.query);
    }
    return submit(data, {
      method: options.id ? "patch" : "post",
      action: cleanedPath,
      encType: "application/json",
    });
  };

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
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
  }, [fetcher.data, fetcher.state, onSubmitted, defaultErrorMessage]);

  return {
    fetcher,
    submit,
    createOrUpdateJson,
    isSubmitting,
  };
}
