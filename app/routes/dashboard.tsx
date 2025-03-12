import InspectionAlertsOverview from "~/components/dashboard/inspection-alerts-overview";
import { InspectionSummaryChart } from "~/components/dashboard/inspection-summary-chart";
import InspectionsOverview from "~/components/dashboard/inspections-overview";
import ProductRequestsOverview from "~/components/dashboard/product-requests-overview";
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
  return (
    <div className="flex flex-1 flex-col gap-4 grow">
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,_minmax(525px,_1fr))] gap-2 sm:gap-4">
        <InspectionSummaryChart />
        {/* <LocationReadinessChart /> */}
        <ProductRequestsOverview />
        <InspectionsOverview />
        <InspectionAlertsOverview />
      </div>
      {/* <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
    </div>
  );
}
