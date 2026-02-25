import { Outlet } from "react-router";
import { guardOrSendHome } from "~/.server/guard";
import { isSystemsAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({
    label: "Roles",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guardOrSendHome(request, (user) => isSystemsAdmin(user));
  return null;
};

export default function AdminRolesLayout() {
  return <Outlet />;
}
