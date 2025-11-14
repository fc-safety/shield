import { Shield } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useRouteLoaderData, type ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import AssetsTable from "~/components/assets/assets-table";
import ClientSitesCard from "~/components/clients/client-sites-card";
import ClientUsersCard from "~/components/clients/client-users-card";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useAuth } from "~/contexts/auth-context";
import type { Asset, Client, Site } from "~/lib/models";
import type { ClientUser } from "~/lib/types";
import { can } from "~/lib/users";
import { validateParam } from "~/lib/utils";
import type { Route } from "./+types/tab";

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
  const tab = validateParam(params, "tab");

  let sites: Site[] | null = null;
  let users: ClientUser[] | null = null;
  let assets: Asset[] | null = null;

  if (tab === "users") {
    const usersResult = await api.users.list(
      request,
      { limit: 10000, clientId: id },
      { context: "admin" }
    );
    users = usersResult.results;
  }
  if (tab === "assets") {
    const assetsResult = await api.assets.list(
      request,
      { limit: 10000, clientId: id },
      { context: "admin" }
    );
    assets = assetsResult.results;
  }
  if (tab === "sites") {
    const sitesResult = await api.sites.list(
      request,
      {
        limit: 10000,
        clientId: id,
        parentSiteId: "_NULL",
        include: { subsites: { include: { address: true } } },
      },
      { context: "admin" }
    );
    sites = sitesResult.results;
  }

  return { users, assets, sites, tab };
};

export default function ClientDetails({
  loaderData: { users, assets, sites, tab: currentTab },
}: Route.ComponentProps) {
  const { client } = useRouteLoaderData<{ client: Client }>("routes/admin/clients/details/layout")!;
  const { user } = useAuth();
  const navigate = useNavigate();

  const tabs = useMemo(
    (): { label: string; value: string; hide?: boolean }[] => [
      {
        label: "Sites",
        value: "sites",
      },
      {
        label: "Users",
        value: "users",
        hide: !can(user, "read", "users"),
      },
      {
        label: "Assets",
        value: "assets",
      },
      {
        label: "Products & Questions",
        value: "products-questions",
      },
    ],
    [user]
  );

  return (
    <Tabs value={currentTab} onValueChange={(newTab) => navigate(`../${newTab}`)}>
      <TabsList className="w-full">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="sites">
        <div className="flex flex-col gap-2">
          {/* <ClientSiteGroupCard
            siteGroups={client.sites?.filter((s) => s._count?.subsites) ?? []}
            clientId={client.id}
            buildToSiteGroup={(id) => `../sites/${id}`}
          /> */}
          <ClientSitesCard
            sites={sites ?? []}
            clientId={client.id}
            buildToSite={(id) => `../sites/${id}`}
            viewContext="admin"
          />
        </div>
      </TabsContent>
      <TabsContent value="users">
        <div className="flex flex-col gap-2">
          <ClientUsersCard
            users={users ?? []}
            getSiteByExternalId={(externalId) =>
              client.sites?.find((s) => s.externalId === externalId)
            }
            clientId={client.id}
            viewContext="admin"
          />
        </div>
      </TabsContent>
      <TabsContent value="assets">
        <Card>
          <CardHeader>
            <CardTitle>
              <Shield /> Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssetsTable assets={assets ?? []} clientId={client.id} viewContext="admin" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
