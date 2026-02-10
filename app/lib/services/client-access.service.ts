import { queryOptions } from "@tanstack/react-query";
import type { MyClientAccess } from "../types";
import { buildPath } from "../urls";

/**
 * Fetches the current user's accessible clients.
 */
export const getMyClientAccessFn = async (fetcher: typeof fetch) =>
  fetcher(buildPath("/client-access/me")).then((r) => r.json() as Promise<MyClientAccess[]>);

/**
 * Query options for fetching accessible clients.
 */
export const getMyClientAccessQueryOptions = (fetcher: typeof fetch) =>
  queryOptions({
    queryKey: ["client-access", "me"] as const,
    queryFn: () => getMyClientAccessFn(fetcher),
    staleTime: 5 * 60 * 1000, // 5 minutes - client access changes infrequently
  });
