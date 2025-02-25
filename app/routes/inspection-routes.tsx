import { api } from "~/.server/api";
import InspectionRoutesPage from "~/components/inspections/inspection-routes-page";
import type { Route } from "./+types/inspection-routes";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.inspectionRoutes.list(request);
};

export default function InspectionRoutes({
  loaderData: routes,
}: Route.ComponentProps) {
  return (
    <div className="w-full max-w-screen-lg self-center">
      <InspectionRoutesPage routes={routes.results} />
    </div>
  );
}
