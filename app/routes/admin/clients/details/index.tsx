import {
  useRouteLoaderData,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { api } from "~/.server/api";
import ClientDetailsCard from "~/components/clients/client-details-card";
import ClientSiteGroupCard from "~/components/clients/client-site-group-card";
import ClientSitesCard from "~/components/clients/client-sites-card";
import ClientUsersCard from "~/components/clients/client-users-card";
import type { Client } from "~/lib/models";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/index";

// When deleting a client, we don't want to revalidate the page. This would
// cause a 404 before the page could navigate back.
export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  if (arg.formMethod === "DELETE") {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  return api.users
    .list(request, { limit: 10000, clientId: id }, { context: "admin" })
    .catch((e) => {
      if (e instanceof Response && e.status === 403) {
        return null;
      }
      throw e;
    });
};

export default function ClientDetails({
  loaderData: users,
}: Route.ComponentProps) {
  const client = useRouteLoaderData<Client>(
    "routes/admin/clients/details/layout"
  );
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-2 sm:gap-4">
        <ClientDetailsCard client={client} />
        <div className="grid gap-4">
          <ClientSiteGroupCard
            siteGroups={client?.sites?.filter((s) => s._count?.subsites) ?? []}
            clientId={client?.id ?? ""}
          />
          <ClientSitesCard
            sites={client?.sites?.filter((s) => !s._count?.subsites) ?? []}
            clientId={client?.id ?? ""}
          />
        </div>
      </div>
      {users && (
        <ClientUsersCard
          users={users.results}
          getSiteByExternalId={(externalId) =>
            client?.sites?.find((s) => s.externalId === externalId)
          }
          clientId={client?.id ?? ""}
        />
      )}
    </div>
  );
}
