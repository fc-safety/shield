import { dehydrate, QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { getAuthenticatedFetcher } from "~/.server/api-utils";
import { getAppState } from "~/.server/sessions";
import { ComplianceByCategoryChart } from "~/components/dashboard/compliance-by-category-chart";
import { ComplianceBySiteChart } from "~/components/dashboard/compliance-by-site-chart";
import { ComplianceHistoryChart } from "~/components/dashboard/compliance-history-chart";
import InspectionAlertsOverview from "~/components/dashboard/inspection-alerts-overview";
import { OverallComplianceChart } from "~/components/dashboard/overall-compliance-chart";
import ProductRequestsOverview from "~/components/dashboard/product-requests-overview";
import { useAuth } from "~/contexts/auth-context";
import { useServerSentEvents } from "~/hooks/use-server-sent-events";
import { getSitesQueryOptions } from "~/lib/services/clients.service";
import {
  COMPLIANCE_HISTORY_QUERY_KEY_PREFIX,
  getComplianceHistoryQueryOptions,
  getInspectionAlertsQueryOptions,
  getProductRequestsQueryOptions,
  INSPECTION_ALERTS_QUERY_KEY_PREFIX,
  PRODUCT_REQUESTS_QUERY_KEY_PREFIX,
} from "~/lib/services/dashboard.service";
import { getProductCategoriesQueryOptions } from "~/lib/services/product-categories.service";
import { can, hasMultiSiteVisibility } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/command-center";

export const handle = {
  breadcrumb: () => ({
    label: "Command Center",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const appState = await getAppState(request);

  const queryClient = new QueryClient();
  const prefetchPromises: Promise<void>[] = [];
  const fetcher = getAuthenticatedFetcher(request);

  prefetchPromises.push(
    // Prefetch overall compliance (just latest month)
    queryClient.prefetchQuery(
      getComplianceHistoryQueryOptions(fetcher, { months: 1, siteId: appState.dash_sum_site_id })
    ),
    // Prefetch overall compliance (just latest month), but no site filtering
    queryClient.prefetchQuery(
      getComplianceHistoryQueryOptions(fetcher, { months: 1, siteId: "all" })
    ),
    // Prefetch compliance history
    queryClient.prefetchQuery(
      getComplianceHistoryQueryOptions(fetcher, { months: appState.dash_comp_hist_months ?? 6 })
    ),
    // Prefetch product/supply requests
    queryClient.prefetchQuery(
      getProductRequestsQueryOptions(fetcher, appState.dash_pr_query ?? {})
    ),
    // Prefetch inspection alerts
    queryClient.prefetchQuery(
      getInspectionAlertsQueryOptions(fetcher, appState.dash_alert_query ?? {})
    ),
    // Prefetch sites without groups
    queryClient.prefetchQuery(getSitesQueryOptions(fetcher, { excludeGroups: true, limit: 200 })),
    // Prefetch product categories
    queryClient.prefetchQuery(getProductCategoriesQueryOptions(fetcher, { limit: 200 }))
  );

  await Promise.all(prefetchPromises);

  return {
    dehydratedState: dehydrate(queryClient),
  };
};

export default function Dashboard() {
  const { user } = useAuth();

  const canReadAssets = can(user, "read", "assets");
  const canReadInspections = can(user, "read", "inspections");
  const canReadProductRequests = can(user, "read", "product-requests");
  const canReadAlerts = can(user, "read", "alerts");
  const canReadSites = can(user, "read", "sites");
  const canViewMultipleSites = hasMultiSiteVisibility(user);

  const queryClient = useQueryClient();

  const invalidateComplianceHistory = useCallback(() => {
    console.debug("Invalidating compliance history");
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === COMPLIANCE_HISTORY_QUERY_KEY_PREFIX,
    });
  }, [queryClient]);
  const debouncedInvalidateComplianceHistory = useDebouncedRefresh(invalidateComplianceHistory);

  const invalidateProductRequests = useCallback(() => {
    console.debug("Invalidating product requests");
    queryClient.invalidateQueries({ queryKey: [PRODUCT_REQUESTS_QUERY_KEY_PREFIX] });
  }, [queryClient]);
  const debouncedInvalidateProductRequests = useDebouncedRefresh(invalidateProductRequests);

  const invalidateInspectionAlerts = useCallback(() => {
    console.debug("Invalidating inspection alerts");
    queryClient.invalidateQueries({ queryKey: [INSPECTION_ALERTS_QUERY_KEY_PREFIX] });
  }, [queryClient]);
  const debouncedInvalidateInspectionAlerts = useDebouncedRefresh(invalidateInspectionAlerts);

  useServerSentEvents({
    key: "command-center",
    models: ["Asset", "Inspection", "Alert", "ProductRequest"],
    onEvent: (event) => {
      const payload = JSON.parse(event.data) as Record<string, string>;
      console.debug("Received event", { payload });
      if (payload.model === "Asset" || payload.model === "Inspection") {
        debouncedInvalidateComplianceHistory();
      }
      if (payload.model === "ProductRequest") {
        debouncedInvalidateProductRequests();
      }
      if (payload.model === "Alert") {
        debouncedInvalidateInspectionAlerts();
      }
    },
  });

  const canReadDashboard =
    canReadAssets || canReadInspections || canReadProductRequests || canReadAlerts;

  return (
    <div className="h-[calc(100vh-110px)] overflow-y-auto">
      <div className="grid h-full auto-rows-[minmax(400px,1fr)] grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(375px,1fr))] sm:gap-4 2xl:grid-cols-3">
        {canReadAssets && <OverallComplianceChart />}
        {canReadAssets && canViewMultipleSites && canReadSites && <ComplianceBySiteChart />}
        {canReadAssets && <ComplianceByCategoryChart />}
        {canReadProductRequests && <ProductRequestsOverview />}
        {canReadAssets && <ComplianceHistoryChart />}
        {/* {canReadInspections && (
        <InspectionsOverview refreshKey={inspectionsRefreshKey} />
      )} */}
        {canReadAlerts && <InspectionAlertsOverview />}
        {!canReadDashboard && (
          <div className="col-span-full flex h-full flex-col items-center justify-center">
            <div className="text-muted-foreground">
              You do not have permission to view any dashboard items.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const useDebouncedRefresh = <T extends (...args: any) => ReturnType<T>>(func: T) => {
  return useDebounceCallback(func, 250, { leading: true, trailing: true });
};
