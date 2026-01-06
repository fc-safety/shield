import type { ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsTabsUsersTab from "~/components/clients/pages/client-details-tabs/users-tab";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/users-tab";

export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  const { formMethod, formAction } = arg;
  if (formMethod === "DELETE" && formAction && !formAction.startsWith("/api/proxy/users")) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  const userResultsPromise = await api.users.list(
    request,
    { limit: 10000, clientId: id },
    { context: "admin" }
  );

  const siteResultsPromise = await api.sites.list(
    request,
    { limit: 10000, clientId: id },
    { context: "admin" }
  );

  const [userResults, siteResults] = await Promise.all([userResultsPromise, siteResultsPromise]);

  return {
    users: userResults.results,
    usersTotalCount: userResults.count,
    sites: siteResults.results,
    clientId: id,
  };
};

export default function UsersTab({
  loaderData: { users, usersTotalCount, sites, clientId },
}: Route.ComponentProps) {
  return (
    <ClientDetailsTabsUsersTab
      users={users}
      usersTotalCount={usersTotalCount}
      clientId={clientId}
      sites={sites}
    />
  );
}
