import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/user-sesssion";
import ClientDetailsLayout, { type Tab } from "~/components/clients/pages/client-details-layout";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import { RequestedAccessContextProvider } from "~/contexts/requested-access-context";
import { buildTitleFromBreadcrumb, getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: () => ({ label: "My Organization" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <DefaultErrorBoundary error={error} />;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);

  // Get current tab value from the URL path.
  const pathParts = URL.parse(request.url)?.pathname.split("/") ?? [];
  const clientIdPathIdx = pathParts.indexOf("my-organization");
  const currentTab = pathParts.at(clientIdPathIdx + 1) as Tab | undefined;

  const showWelcome = getSearchParam(request, "welcome") === "true";

  const clientPromise = api.clients.getMyOrganization(request).then((r) => r.client);

  // Without an admin context, this should only get the user's own sites.
  const sitesPromise = api.sites
    .list(request, {
      limit: 10000,
    })
    .then((r) => r.results);

  const [client, sites] = await Promise.all([clientPromise, sitesPromise]);

  if (!client) {
    throw new Error("No client found for user.");
  }

  return { client, sites, currentTab, showWelcome };
};

export default function MyOrganization({
  loaderData: { client, currentTab, showWelcome },
}: Route.ComponentProps) {
  return (
    <RequestedAccessContextProvider viewContext="user">
      <ClientDetailsLayout
        client={client}
        currentTab={currentTab ?? "sites"}
        showWelcome={showWelcome}
      />
    </RequestedAccessContextProvider>
  );
}
