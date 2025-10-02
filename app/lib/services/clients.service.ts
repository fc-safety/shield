import type { Client, ResultsPage, Site } from "../models";
import { buildPath } from "../urls";

interface GetSitesOptions {
  limit?: number;
  excludeGroups?: boolean;
}

export const getSitesQueryKey = (options?: GetSitesOptions) =>
  [
    "sites",
    {
      limit: options?.limit ?? 200,
      subsites: options?.excludeGroups ? { none: "" } : undefined,
    },
  ] as const;

export const getSitesFn =
  (fetcher: typeof fetch) =>
  async ({ queryKey }: { queryKey: ReturnType<typeof getSitesQueryKey> }) => {
    return fetcher(buildPath("/sites", queryKey[1]))
      .then((r) => r.json() as Promise<ResultsPage<Site>>)
      .then((r) => r.results);
  };

export const getSitesQueryOptions = (fetcher: typeof fetch, options?: GetSitesOptions) => ({
  queryKey: getSitesQueryKey(options),
  queryFn: getSitesFn(fetcher),
});

export interface GetMyOrganizationResult {
  site: Pick<Site, "id" | "name" | "externalId" | "address" | "phoneNumber" | "primary">;
  client: Pick<Client, "id" | "name" | "externalId" | "address" | "phoneNumber" | "demoMode">;
}

export const getMyOrganizationQueryKey = () => ["my-organization"] as const;

export const getMyOrganizationFn = (fetcher: typeof fetch) => async () => {
  return fetcher(buildPath("/clients/my-organization")).then(
    (r) => r.json() as Promise<GetMyOrganizationResult>
  );
};

export const getMyOrganizationQueryOptions = (fetcher: typeof fetch) => ({
  queryKey: getMyOrganizationQueryKey(),
  queryFn: getMyOrganizationFn(fetcher),
});
