import { api } from "~/.server/api";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import InspectionRouteDetails from "~/components/inspections/pages/inspection-route-details";
import type { Route } from "./+types/details";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DefaultErrorBoundary error={error} />;
}

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const route = await api.inspectionRoutes.get(request, params.id);
  return { route };
};

export default function MyInspectionRoutesDetails({ loaderData: { route } }: Route.ComponentProps) {
  return <InspectionRouteDetails route={route} />;
}
