import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/user-sesssion";
import ClientDetailsCard from "~/components/clients/client-details-card";
import ClientSiteGroupCard from "~/components/clients/client-site-group-card";
import ClientSitesCard from "~/components/clients/client-sites-card";
import ClientUsersCard from "~/components/clients/client-users-card";
import { can } from "~/lib/users";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);

  const canReadUsers = can(user, "read", "users");
  const canReadSites = can(user, "read", "sites");

  const [client, sites, users] = await Promise.all([
    api.clients
      .list(request, {
        limit: 1,
        externalId: user.clientId,
      })
      .then((r) => r.results.at(0)),
    canReadSites
      ? api.sites
          .list(request, {
            limit: 10000,
          })
          .then((r) => r.results)
      : Promise.resolve(null),
    canReadUsers
      ? api.users
          .list(request, {
            limit: 10000,
          })
          .then((r) => r.results)
      : Promise.resolve(null),
  ]);

  if (!client) {
    throw new Error("No client found for user.");
  }

  return {
    client,
    sites,
    users,
  };
};

export default function ClientDetails({
  loaderData: { client, sites, users },
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-2 sm:gap-4">
        <ClientDetailsCard client={client} />
        {sites && (
          <div className="grid gap-4">
            <ClientSiteGroupCard
              siteGroups={sites.filter((s) => s._count?.subsites)}
              clientId={client.id}
            />
            <ClientSitesCard
              sites={sites.filter((s) => !s._count?.subsites)}
              clientId={client.id}
            />
          </div>
        )}
      </div>
      {users && (
        <ClientUsersCard
          users={users}
          getSiteByExternalId={
            sites
              ? (externalId) => sites.find((s) => s.externalId === externalId)
              : undefined
          }
          clientId={client.id}
        />
      )}
    </div>
  );
}
