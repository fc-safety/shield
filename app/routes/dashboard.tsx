import { InspectionSummaryChart } from "~/components/dashboard/inspection-summary-chart";
import { LocationReadinessChart } from "~/components/dashboard/location-readiness-chart";
import type { Asset } from "~/lib/models";
import { buildTitleFromBreadcrumb, countBy } from "~/lib/utils";
import type { Route } from "./+types/dashboard";

export const handle = {
  breadcrumb: () => ({
    label: "Dashboard",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

const demoAssets: Asset[] = [];

export const loader = () => {
  return {
    inspectionSummaryData: countBy(demoAssets, "status").map(
      ({ status, count }) => ({
        status,
        totalAssets: count,
      })
    ),
  };
};

export default function Dashboard({
  loaderData: { inspectionSummaryData },
}: Route.ComponentProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 grow">
      <div className="grid auto-rows-min gap-2 sm:gap-4 lg:grid-cols-2 3xl:grid-cols-3">
        <InspectionSummaryChart data={inspectionSummaryData} />
        <LocationReadinessChart />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      {/* <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
    </div>
  );
}
