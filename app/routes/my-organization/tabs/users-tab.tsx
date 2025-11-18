import { useRouteLoaderData } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsUsersTab from "~/components/clients/pages/client-details-tabs/users-tab";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/users-tab";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const usersResult = await api.users.list(request, { limit: 10000 });

  return {
    users: usersResult.results,
  };
};

export default function UsersTab({ loaderData: { users } }: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("my-organization");
  return (
    <ClientDetailsTabsUsersTab users={users} clientId={layoutData?.client?.id} viewContext="user" />
  );
}
