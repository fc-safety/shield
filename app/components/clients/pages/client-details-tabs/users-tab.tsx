import type { ViewContext } from "~/.server/api-utils";
import type { Site } from "~/lib/models";
import type { ClientUser } from "~/lib/types";
import ClientUsersCard from "../../client-users-card";

export default function ClientDetailsTabsUsersTab({
  users,
  usersTotalCount,
  clientId,
  viewContext,
  sites,
}: {
  users: ClientUser[];
  usersTotalCount?: number;
  clientId?: string;
  viewContext: ViewContext;
  sites: Site[];
}) {
  return (
    <ClientUsersCard
      users={users}
      usersTotalCount={usersTotalCount}
      clientId={clientId}
      sites={sites}
      viewContext={viewContext}
    />
  );
}
