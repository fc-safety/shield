import { dehydrate, QueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import {
  getComplianceHistoryQueryOptions,
  getInspectionAlertsQueryOptions,
  getMySitesQueryOptions,
  getProductRequestsQueryOptions,
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

  const monthsToPrefetch = new Set([1, appState.dash_comp_hist_months ?? 6]);
  for (const month of monthsToPrefetch) {
    prefetchPromises.push(
      queryClient.prefetchQuery(
        getComplianceHistoryQueryOptions(getAuthenticatedFetcher(request), { months: month })
      )
    );
  }

  prefetchPromises.push(
    queryClient.prefetchQuery(
      getProductRequestsQueryOptions(getAuthenticatedFetcher(request), appState.dash_pr_query ?? {})
    )
  );

  prefetchPromises.push(
    queryClient.prefetchQuery(
      getInspectionAlertsQueryOptions(
        getAuthenticatedFetcher(request),
        appState.dash_alert_query ?? {}
      )
    )
  );

  prefetchPromises.push(
    queryClient.prefetchQuery(getMySitesQueryOptions(getAuthenticatedFetcher(request)))
  );

  prefetchPromises.push(
    queryClient.prefetchQuery(
      getProductCategoriesQueryOptions(getAuthenticatedFetcher(request), { limit: 200 })
    )
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

  const [overallComplianceRefreshKey, setOverallComplianceRefreshKey] = useState(0);
  const [complianceBySiteRefreshKey, setComplianceBySiteRefreshKey] = useState(0);
  const [complianceByCategoryRefreshKey, setComplianceByCategoryRefreshKey] = useState(0);
  const [productRequestsRefreshKey, setProductRequestsRefreshKey] = useState(0);
  const [complianceHistoryKey, setComplianceHistoryKey] = useState(0);
  const [inspectionAlertsRefreshKey, setInspectionAlertsRefreshKey] = useState(0);

  useServerSentEvents({
    key: "command-center",
    models: ["Asset", "Inspection", "Alert", "ProductRequest"],
    onEvent: (event) => {
      const payload = JSON.parse(event.data) as Record<string, string>;
      if (payload.model === "Asset" || payload.model === "Inspection") {
        setOverallComplianceRefreshKey((prev) => prev + 1);
        setComplianceBySiteRefreshKey((prev) => prev + 1);
        setComplianceByCategoryRefreshKey((prev) => prev + 1);
        setComplianceHistoryKey((prev) => prev + 1);
      }
      if (payload.model === "ProductRequest") {
        setProductRequestsRefreshKey((prev) => prev + 1);
      }
      if (payload.model === "Alert") {
        setInspectionAlertsRefreshKey((prev) => prev + 1);
      }
    },
  });

  const canReadDashboard =
    canReadAssets || canReadInspections || canReadProductRequests || canReadAlerts;

  return (
    <div className="h-[calc(100vh-110px)] overflow-y-auto">
      <div className="grid h-full auto-rows-[minmax(400px,1fr)] grid-cols-[repeat(auto-fill,minmax(375px,1fr))] gap-2 sm:gap-4 2xl:grid-cols-3">
        {canReadAssets && <OverallComplianceChart refreshKey={overallComplianceRefreshKey} />}
        {canReadAssets && canViewMultipleSites && canReadSites && (
          <ComplianceBySiteChart refreshKey={complianceBySiteRefreshKey} />
        )}
        {canReadAssets && <ComplianceByCategoryChart refreshKey={complianceByCategoryRefreshKey} />}
        {canReadProductRequests && (
          <ProductRequestsOverview refreshKey={productRequestsRefreshKey} />
        )}
        {canReadAssets && <ComplianceHistoryChart refreshKey={complianceHistoryKey} />}
        {/* {canReadInspections && (
        <InspectionsOverview refreshKey={inspectionsRefreshKey} />
      )} */}
        {canReadAlerts && <InspectionAlertsOverview refreshKey={inspectionAlertsRefreshKey} />}
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
