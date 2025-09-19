import { endOfDay, startOfDay, subDays } from "date-fns";
import type { GetComplianceHistoryResponse } from "~/components/dashboard/types/stats";
import type { Alert, ProductRequest, ResultsPage, Site } from "../models";
import { buildPath } from "../urls";

interface GetComplianceHistoryOptions {
  months: number;
}

export const getComplianceHistoryFn =
  (fetcher: typeof fetch, options: GetComplianceHistoryOptions) => async () => {
    return fetcher(buildPath("/stats/compliance-history", { ...options })).then(
      (r) => r.json() as Promise<GetComplianceHistoryResponse>
    );
  };

export const getComplianceHistoryQueryKey = (options: GetComplianceHistoryOptions) => [
  "compliance-history",
  options,
];

export const getMySitesFn = (fetcher: typeof fetch) => async () => {
  return fetcher("/sites?limit=200&subsites[none]=")
    .then((r) => r.json() as Promise<ResultsPage<Site>>)
    .then((r) => r.results);
};

export const getMySitesQueryKey = () => ["my-sites-200"];

export const getMySitesQueryOptions = (fetcher: typeof fetch) => ({
  queryKey: getMySitesQueryKey(),
  queryFn: getMySitesFn(fetcher),
});

export const getComplianceHistoryQueryOptions = (
  fetcher: typeof fetch,
  options: GetComplianceHistoryOptions
) => ({
  queryKey: getComplianceHistoryQueryKey(options),
  queryFn: getComplianceHistoryFn(fetcher, options),
});

interface GetProductRequestsOptions {
  createdOn?: {
    gte: string;
    lte?: string;
  };
}

const buildProductRequestsQueryParams = (options: GetProductRequestsOptions) => {
  return {
    createdOn: options.createdOn ?? {
      gte: startOfDay(subDays(new Date(), 30)).toISOString(),
      lte: endOfDay(new Date()).toISOString(),
    },
    limit: 10000,
  };
};

export const getProductRequestsFn =
  (fetcher: typeof fetch, options: GetProductRequestsOptions) => async () => {
    return fetcher(buildPath("/product-requests", buildProductRequestsQueryParams(options))).then(
      (r) => r.json() as Promise<ResultsPage<ProductRequest>>
    );
  };

export const getProductRequestsQueryKey = (options: GetProductRequestsOptions) => [
  "product-requests",
  buildProductRequestsQueryParams(options),
];

export const getProductRequestsQueryOptions = (
  fetcher: typeof fetch,
  options: GetProductRequestsOptions
) => ({
  queryKey: getProductRequestsQueryKey(options),
  queryFn: getProductRequestsFn(fetcher, options),
});

interface GetInspectionAlertsOptions {
  createdOn?: {
    gte: string;
    lte?: string;
  };
}

const buildInspectionAlertsQueryParams = (options: GetInspectionAlertsOptions) => {
  return {
    createdOn: options.createdOn ?? {
      gte: startOfDay(subDays(new Date(), 30)).toISOString(),
      lte: endOfDay(new Date()).toISOString(),
    },
    limit: 10000,
  };
};

export const getInspectionAlertsFn =
  (fetcher: typeof fetch, options: GetInspectionAlertsOptions) => async () => {
    return fetcher(buildPath("/alerts", buildInspectionAlertsQueryParams(options))).then(
      (r) => r.json() as Promise<ResultsPage<Alert>>
    );
  };

export const getInspectionAlertsQueryKey = (options: GetInspectionAlertsOptions) => [
  "inspection-alerts",
  buildInspectionAlertsQueryParams(options),
];

export const getInspectionAlertsQueryOptions = (
  fetcher: typeof fetch,
  options: GetInspectionAlertsOptions
) => ({
  queryKey: getInspectionAlertsQueryKey(options),
  queryFn: getInspectionAlertsFn(fetcher, options),
});
