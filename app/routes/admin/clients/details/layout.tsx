import { type ShouldRevalidateFunctionArgs, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsLayout, { type Tab } from "~/components/clients/pages/client-details-layout";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/layout";

// When deleting a client, we don't want to revalidate the page. This would
// cause a 404 before the page could navigate back.
export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  console.log("should revalidate: clients/details/layout");
  if (arg.formMethod === "DELETE") {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const handle = {
  breadcrumb: ({ loaderData }: Route.MetaArgs | UIMatch<Route.MetaArgs["loaderData"]>) => ({
    label: loaderData?.client.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const id = validateParam(params, "id");

  // Get current tab value from the URL path.
  const pathParts = URL.parse(request.url)?.pathname.split("/") ?? [];
  const clientIdPathIdx = pathParts.indexOf(id);
  const currentTab = pathParts.at(clientIdPathIdx + 1) as Tab | undefined;

  const client = await api.clients.get(request, id, { context: "admin" });
  return { client, currentTab };
};

export default function AdminClientDetailsLayout({
  loaderData: { client, currentTab },
}: Route.ComponentProps) {
  return (
    <ClientDetailsLayout client={client} viewContext="admin" currentTab={currentTab ?? "sites"} />
  );
}
