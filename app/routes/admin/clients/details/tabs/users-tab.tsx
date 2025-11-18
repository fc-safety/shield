import { api } from "~/.server/api";
import ClientDetailsTabsUsersTab from "~/components/clients/pages/client-details-tabs/users-tab";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/users-tab";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const usersResult = await api.users.list(
    request,
    { limit: 10000, clientId: id },
    { context: "admin" }
  );

  return {
    users: usersResult.results,
    clientId: id,
  };
};

export default function UsersTab({ loaderData: { users, clientId } }: Route.ComponentProps) {
  return <ClientDetailsTabsUsersTab users={users} clientId={clientId} viewContext="admin" />;
}
