import { Outlet } from "react-router";
import { guardOrSendHome } from "~/.server/guard";
import { isSuperAdmin } from "~/lib/users";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({
    label: "Clients",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  await guardOrSendHome(request, (user) => isSuperAdmin(user));
  return null;
};

export default function AdminClients() {
  return <Outlet />;
}
