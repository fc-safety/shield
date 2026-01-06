import { Outlet } from "react-router";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import { ViewContextProvider } from "~/contexts/view-context";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({
    label: "Admin",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DefaultErrorBoundary error={error} />;
}

export default function Admin() {
  return (
    <ViewContextProvider value="admin">
      <Outlet />
    </ViewContextProvider>
  );
}
