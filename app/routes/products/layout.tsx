import { Outlet } from "react-router";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import { useAuth } from "~/contexts/auth-context";
import { ViewContextProvider } from "~/contexts/view-context";
import { isGlobalAdmin } from "~/lib/users";
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
  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const viewContext = userIsGlobalAdmin ? "admin" : "user";

  return (
    <ViewContextProvider value={viewContext}>
      <Outlet />
    </ViewContextProvider>
  );
}
