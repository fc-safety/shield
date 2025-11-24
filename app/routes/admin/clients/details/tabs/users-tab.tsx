import { api } from "~/.server/api";
import ClientDetailsTabsUsersTab from "~/components/clients/pages/client-details-tabs/users-tab";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/users-tab";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const usersPromise = await api.users
    .list(request, { limit: 10000, clientId: id }, { context: "admin" })
    .then((r) => r.results);

  const sitesPromise = await api.sites
    .list(request, { limit: 10000, clientId: id }, { context: "admin" })
    .then((r) => r.results);

  const [users, sites] = await Promise.all([usersPromise, sitesPromise]);

  return {
    users,
    sites,
    clientId: id,
  };
};

export default function UsersTab({ loaderData: { users, sites, clientId } }: Route.ComponentProps) {
  return (
    <ClientDetailsTabsUsersTab
      users={users}
      clientId={clientId}
      sites={sites}
      viewContext="admin"
    />
  );
}
