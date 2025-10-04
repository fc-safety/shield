import {
  type DefaultError,
  HydrationBoundary,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type PropsWithChildren, useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { useDehydratedState } from "~/hooks/use-dehydrated-state";
import { buildErrorDisplay } from "~/lib/error-handling";
import { cleanErrorMessage, extractErrorMessage } from "../lib/errors";
export default function QueryContext({ children }: PropsWithChildren) {
  const defaultErrorAlertId = useId();

  const handleError = useCallback(
    async (error: DefaultError) => {
      const errMsg = await extractErrorMessage(error);
      console.error(errMsg, error);
      if (errMsg) {
        toast.error(
          buildErrorDisplay(errMsg, {
            defaultErrorMessage: asString(cleanErrorMessage(errMsg)),
          }),
          { id: defaultErrorAlertId, icon: null }
        );
        return;
      }

      toast.error(
        buildErrorDisplay(null, {
          defaultErrorMessage: "Oops! Something went wrong.",
        }),
        { id: defaultErrorAlertId, icon: null }
      );
    },
    [defaultErrorAlertId]
  );

  const [queryClient] = useState(() => {
    return new QueryClient({
      queryCache: new QueryCache({
        onError: handleError,
      }),
      mutationCache: new MutationCache({
        onError: (error) => {
          handleError(error);
        },
      }),
      defaultOptions: {
        queries: {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching immediately on the client
          staleTime: 10 * 1000,
        },
      },
    });
  });

  const dehydratedState = useDehydratedState();

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}

const asString = (strOrArray: string | string[]) => {
  if (Array.isArray(strOrArray)) {
    return strOrArray.join("\n");
  }
  return strOrArray;
};
