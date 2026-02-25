import { Outlet } from "react-router";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import { RequestedAccessContextProvider } from "~/contexts/requested-access-context";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({
    label: "Products",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DefaultErrorBoundary error={error} />;
}

export default function ProductsLayout() {
  return (
    <RequestedAccessContextProvider>
      <Outlet />
    </RequestedAccessContextProvider>
  );
}
