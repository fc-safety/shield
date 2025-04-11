import { ComplianceBySiteChart } from "~/components/dashboard/compliance-by-site-chart";
import InspectionAlertsOverview from "~/components/dashboard/inspection-alerts-overview";
import InspectionsOverview from "~/components/dashboard/inspections-overview";
import { OverallComplianceChart } from "~/components/dashboard/overall-compliance-chart";
import ProductRequestsOverview from "~/components/dashboard/product-requests-overview";
import { useAuth } from "~/contexts/auth-context";
import { can } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/dashboard";

export const handle = {
  breadcrumb: () => ({
    label: "Dashboard",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export default function Dashboard() {
  const { user } = useAuth();

  const canReadAssets = can(user, "read", "assets");
  const canReadInspections = can(user, "read", "inspections");
  const canReadProductRequests = can(user, "read", "product-requests");
  const canReadAlerts = can(user, "read", "alerts");

  const canReadDashboard =
    canReadAssets ||
    canReadInspections ||
    canReadProductRequests ||
    canReadAlerts;

  return (
    <div className="flex flex-1 flex-col gap-4 grow">
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,_minmax(475px,_1fr))] gap-2 sm:gap-4">
        {canReadAssets && <OverallComplianceChart />}
        {canReadAssets && <ComplianceBySiteChart />}
        {/* <LocationReadinessChart /> */}
        {canReadProductRequests && <ProductRequestsOverview />}
        {canReadInspections && <InspectionsOverview />}
        {canReadAlerts && <InspectionAlertsOverview />}
        {!canReadDashboard && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-muted-foreground">
              You do not have permission to view any dashboard items.
            </div>
          </div>
        )}
      </div>
      {/* <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
    </div>
  );
}
