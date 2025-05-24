import { api } from "~/.server/api";
import InspectionRoutesPage from "~/components/inspections/inspection-routes-page";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/inspection-routes";

export const handle = {
  breadcrumb: () => ({ label: "Inspection Routes" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.inspectionRoutes.list(request);
};

export default function InspectionRoutes({
  loaderData: routes,
}: Route.ComponentProps) {
  return (
    <div className="w-full max-w-(--breakpoint-lg) self-center">
      <InspectionRoutesPage routes={routes.results} />
    </div>
  );
}
