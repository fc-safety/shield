import { Shield } from "lucide-react";
import { useRouteLoaderData, type ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/user-sesssion";
import AssetsTable from "~/components/assets/assets-table";
import ClientDetailsCard from "~/components/clients/client-details-card";
import ClientSiteGroupCard from "~/components/clients/client-site-group-card";
import ClientSitesCard from "~/components/clients/client-sites-card";
import ClientUsersCard from "~/components/clients/client-users-card";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Client } from "~/lib/models";
import { can } from "~/lib/users";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/index";

// When deleting a client, we don't want to revalidate the page. This would
// cause a 404 before the page could navigate back.
export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  // Don't revalidate if deleting the current client.
  if (
    arg.formMethod === "DELETE" &&
    arg.formAction &&
    arg.formAction.split("?").at(0)?.replace(/\/$/, "") ===
      `/api/proxy/clients/${arg.currentParams.id}`
  ) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");
  const { user } = await requireUserSession(request);

  const getAssets = async () =>
    api.assets.list(request, { limit: 10000, clientId: id }, { context: "admin" });

  if (can(user, "read", "users")) {
    const [users, assets] = await Promise.all([
      api.users.list(request, { limit: 10000, clientId: id }, { context: "admin" }),
      getAssets(),
    ]);

    return { users, assets };
  }

  return { users: null, assets: await getAssets() };
};

export default function ClientDetails({ loaderData: { users, assets } }: Route.ComponentProps) {
  const client = useRouteLoaderData<Client>("routes/admin/clients/details/layout");
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-2 sm:gap-4">
        <ClientDetailsCard client={client} viewContext="admin" />
        <div className="flex flex-col gap-2 sm:gap-4">
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
      <Card>
        <CardHeader>
          <CardTitle>
            <Shield /> Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AssetsTable assets={assets.results} clientId={client?.id} viewContext="admin" />
        </CardContent>
      </Card>
    </div>
  );
}
