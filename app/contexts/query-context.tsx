import {
  HydrationBoundary,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
import { useAlertOnApiError } from "~/hooks/use-alert-on-api-error";
import { useDehydratedState } from "~/hooks/use-dehydrated-state";
export default function QueryContext({ children }: PropsWithChildren) {
  const { handleError } = useAlertOnApiError();

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
