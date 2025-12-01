import { redirect } from "react-router";
import { api } from "~/.server/api";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import InspectionRoutesLayout from "~/components/inspections/pages/inspection-routes-layout";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({ label: "Inspection Routes" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DefaultErrorBoundary error={error} />;
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const routesResult = await api.inspectionRoutes.list(request);

  if (!params.id && routesResult.results.length > 0) {
    return redirect(`/inspection-routes/${routesResult.results[0].id}`);
  }

  return { routes: routesResult.results };
};

export default function MyInspectionRoutesLayout({ loaderData: { routes } }: Route.ComponentProps) {
  return <InspectionRoutesLayout routes={routes} />;
}
