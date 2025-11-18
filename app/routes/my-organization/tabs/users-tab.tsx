import { useRouteLoaderData } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsUsersTab from "~/components/clients/pages/client-details-tabs/users-tab";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/users-tab";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const usersPromise = await api.users.list(request, { limit: 10000 }).then((r) => r.results);

  const [users] = await Promise.all([usersPromise]);

  return {
    users,
  };
};

export default function UsersTab({ loaderData: { users } }: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/my-organization/layout");

  return (
    <ClientDetailsTabsUsersTab
      users={users}
      sites={layoutData?.sites ?? []}
      clientId={layoutData?.client?.id}
      viewContext="user"
    />
  );
}
