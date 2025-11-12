import { queryOptions } from "@tanstack/react-query";
import type { Client, ResultsPage, Site } from "../models";
import { buildPath } from "../urls";

interface GetSitesOptions {
  limit?: number;
  excludeGroups?: boolean;
}

export const getSitesQueryOptions = (fetcher: typeof fetch, options?: GetSitesOptions) =>
  queryOptions({
    queryKey: [
      "sites",
      {
        limit: options?.limit ?? 200,
        subsites: options?.excludeGroups ? { none: "" } : undefined,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/sites", queryKey[1]))
        .then((r) => r.json() as Promise<ResultsPage<Site>>)
        .then((r) => r.results),
  });

export interface GetMyOrganizationResult {
  site: Pick<Site, "id" | "name" | "externalId" | "address" | "phoneNumber" | "primary">;
  client: Pick<Client, "id" | "name" | "externalId" | "address" | "phoneNumber" | "demoMode">;
}

export const getMyOrganizationFn = async (fetcher: typeof fetch) =>
  fetcher(buildPath("/clients/my-organization")).then(
    (r) => r.json() as Promise<GetMyOrganizationResult>
  );

export const getMyOrganizationQueryOptions = (fetcher: typeof fetch) =>
  queryOptions({
    queryKey: ["my-organization"] as const,
    queryFn: () => getMyOrganizationFn(fetcher),
  });
