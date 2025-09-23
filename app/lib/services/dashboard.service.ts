import { endOfDay, startOfDay, subDays } from "date-fns";
import type { GetComplianceHistoryResponse } from "~/components/dashboard/types/stats";
import type { Alert, ProductRequest, ResultsPage } from "../models";
import { buildPath } from "../urls";

interface GetComplianceHistoryOptions {
  months: number;
  siteId?: string;
}

export const getComplianceHistoryQueryKey = (options: GetComplianceHistoryOptions) =>
  [
    "compliance-history",
    {
      months: options.months,
      siteId: options.siteId === "all" ? undefined : options.siteId,
    },
  ] as const;

export const getComplianceHistoryFn =
  (fetcher: typeof fetch) =>
  async ({ queryKey }: { queryKey: ReturnType<typeof getComplianceHistoryQueryKey> }) => {
    return fetcher(buildPath("/stats/compliance-history", { ...queryKey[1] })).then(
      (r) => r.json() as Promise<GetComplianceHistoryResponse>
    );
  };

export const getComplianceHistoryQueryOptions = (
  fetcher: typeof fetch,
  options: GetComplianceHistoryOptions
) => ({
  queryKey: getComplianceHistoryQueryKey(options),
  queryFn: getComplianceHistoryFn(fetcher),
});

interface GetProductRequestsOptions {
  createdOn?: {
    gte: string;
    lte?: string;
  };
}

export const getProductRequestsQueryKey = (options: GetProductRequestsOptions) =>
  [
    "product-requests",
    {
      createdOn: options.createdOn ?? getDefaultDateRange(),
      limit: 10000,
    },
  ] as const;

export const getProductRequestsFn =
  (fetcher: typeof fetch) =>
  async ({ queryKey }: { queryKey: ReturnType<typeof getProductRequestsQueryKey> }) => {
    return fetcher(buildPath("/product-requests", queryKey[1])).then(
      (r) => r.json() as Promise<ResultsPage<ProductRequest>>
    );
  };

export const getProductRequestsQueryOptions = (
  fetcher: typeof fetch,
  options: GetProductRequestsOptions
) => ({
  queryKey: getProductRequestsQueryKey(options),
  queryFn: getProductRequestsFn(fetcher),
});

interface GetInspectionAlertsOptions {
  createdOn?: {
    gte: string;
    lte?: string;
  };
}

export const getInspectionAlertsQueryKey = (options: GetInspectionAlertsOptions) =>
  [
    "inspection-alerts",
    {
      createdOn: options.createdOn ?? getDefaultDateRange(),
      limit: 10000,
    },
  ] as const;

export const getInspectionAlertsFn =
  (fetcher: typeof fetch) =>
  async ({ queryKey }: { queryKey: ReturnType<typeof getInspectionAlertsQueryKey> }) => {
    return fetcher(buildPath("/alerts", queryKey[1])).then(
      (r) => r.json() as Promise<ResultsPage<Alert>>
    );
  };

export const getInspectionAlertsQueryOptions = (
  fetcher: typeof fetch,
  options: GetInspectionAlertsOptions
) => ({
  queryKey: getInspectionAlertsQueryKey(options),
  queryFn: getInspectionAlertsFn(fetcher),
});

export const getDefaultDateRange = () => ({
  gte: startOfDay(subDays(new Date(), 30)).toISOString(),
  lte: endOfDay(new Date()).toISOString(),
});
