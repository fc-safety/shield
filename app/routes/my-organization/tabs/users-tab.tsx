import { useRouteLoaderData, type ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsUsersTab from "~/components/clients/pages/client-details-tabs/users-tab";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/users-tab";

export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  const { formMethod, formAction } = arg;
  if (formMethod === "DELETE" && formAction && !formAction.startsWith("/api/proxy/users")) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userResultsPromise = await api.users.list(request, { limit: 10000 });

  const [userResults] = await Promise.all([userResultsPromise]);

  return {
    users: userResults.results,
    usersTotalCount: userResults.count,
  };
};

export default function UsersTab({ loaderData: { users, usersTotalCount } }: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/my-organization/layout");

  return (
    <ClientDetailsTabsUsersTab
      users={users}
      usersTotalCount={usersTotalCount}
      sites={layoutData?.sites ?? []}
      clientId={layoutData?.client?.id}
      viewContext="user"
    />
  );
}
