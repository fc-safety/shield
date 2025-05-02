import { api } from "~/.server/api";
import InspectionRoutesPage from "~/components/inspections/inspection-routes-page";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/routes";

export const handle = {
  breadcrumb: () => ({ label: "Manage Routes" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.inspectionRoutes.list(request);
};

export default function InspectManageRoutes({
  loaderData: routes,
}: Route.ComponentProps) {
  return <InspectionRoutesPage routes={routes.results} />;
}
