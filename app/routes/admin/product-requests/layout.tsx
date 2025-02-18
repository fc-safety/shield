import { Outlet } from "react-router";
import { guardOrSendHome } from "~/.server/guard";
import { isGlobalAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({
    label: "Product Requests",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guardOrSendHome(request, (user) => isGlobalAdmin(user));
  return null;
};

export default function AdminProductRequestsLayout() {
  return <Outlet />;
}
