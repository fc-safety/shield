import { Outlet, type ShouldRevalidateFunctionArgs, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import ClientDetailsCard from "~/components/clients/client-details-card";
import ClientDetailsHeader from "~/components/clients/client-details-header";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/layout";

// When deleting a client, we don't want to revalidate the page. This would
// cause a 404 before the page could navigate back.
export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
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

  const client = await api.clients.get(request, id, { context: "admin" });
  return { client };
};

export default function AdminClientDetailsLayout({ loaderData: { client } }: Route.ComponentProps) {
  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid w-full grid-cols-1 gap-2 @4xl:grid-cols-[1fr_325px]">
        <div className="flex min-w-0 flex-col gap-2">
          {client.demoMode && (
            <div className="bg-primary/10 border-primary/50 text-primary w-full rounded-xl border px-2 py-1 text-xs">
              <span className="font-semibold">Demo mode enabled:</span> This client has certain
              features enabled and others disabled to facilitate product demonstrations.
            </div>
          )}
          <ClientDetailsHeader client={client} />
          <Outlet />
        </div>
        <ClientDetailsCard client={client} viewContext="admin" />
      </div>
    </div>
  );
}
