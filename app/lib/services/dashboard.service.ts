import { queryOptions } from "@tanstack/react-query";
import { endOfDay, startOfDay, subDays } from "date-fns";
import type { GetComplianceHistoryResponse } from "~/components/dashboard/types/stats";
import type { Alert, ProductRequest, ResultsPage } from "../models";
import { buildPath } from "../urls";

export const COMPLIANCE_HISTORY_QUERY_KEY_PREFIX = "compliance-history";
export const PRODUCT_REQUESTS_QUERY_KEY_PREFIX = "product-requests";
export const INSPECTION_ALERTS_QUERY_KEY_PREFIX = "inspection-alerts";

export const getComplianceHistoryQueryOptions = (
  fetcher: typeof fetch,
  options: {
    months: number;
    siteId?: string;
  }
) =>
  queryOptions({
    queryKey: [
      COMPLIANCE_HISTORY_QUERY_KEY_PREFIX,
      {
        months: options.months,
        siteId: options.siteId === "all" ? undefined : options.siteId,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/stats/compliance-history", { ...queryKey[1] })).then(
        (r) => r.json() as Promise<GetComplianceHistoryResponse>
      ),
  });

export const getProductRequestsQueryOptions = (
  fetcher: typeof fetch,
  options: {
    createdOn?: {
      gte: string;
      lte?: string;
    };
  }
) =>
  queryOptions({
    queryKey: [
      PRODUCT_REQUESTS_QUERY_KEY_PREFIX,
      {
        createdOn: options.createdOn ?? getDefaultDateRange(),
        limit: 10000,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/product-requests", queryKey[1])).then(
        (r) => r.json() as Promise<ResultsPage<ProductRequest>>
      ),
  });

export const getInspectionAlertsQueryOptions = (
  fetcher: typeof fetch,
  options: {
    createdOn?: {
      gte: string;
      lte?: string;
    };
  }
) =>
  queryOptions({
    queryKey: [
      INSPECTION_ALERTS_QUERY_KEY_PREFIX,
      {
        createdOn: options.createdOn ?? getDefaultDateRange(),
        limit: 10000,
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/alerts", queryKey[1])).then(
        (r) => r.json() as Promise<ResultsPage<Alert>>
      ),
  });

export const getDefaultDateRange = () => ({
  gte: startOfDay(subDays(new Date(), 30)).toISOString(),
  lte: endOfDay(new Date()).toISOString(),
});
