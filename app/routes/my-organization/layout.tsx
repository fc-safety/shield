import { api } from "~/.server/api";
import { requireUserSession } from "~/.server/user-sesssion";
import ClientDetailsLayout, { type Tab } from "~/components/clients/pages/client-details-layout";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import { ViewContextProvider } from "~/contexts/view-context";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
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

  const clientPromise = api.clients
    .list(request, {
      limit: 1,
      externalId: user.clientId,
    })
    .then((r) => r.results.at(0));

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

  return { client, sites, currentTab };
};

export default function MyOrganization({
  loaderData: { client, currentTab },
}: Route.ComponentProps) {
  return (
    <ViewContextProvider value="user">
      <ClientDetailsLayout client={client} currentTab={currentTab ?? "sites"} />
    </ViewContextProvider>
  );
}
