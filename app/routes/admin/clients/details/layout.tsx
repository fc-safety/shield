import { Outlet, type UIMatch } from "react-router";
import { getValidatedFormData } from "remix-hook-form";
import type { z } from "zod";
import { api } from "~/.server/api";
import { createSiteSchemaResolver, type createSiteSchema } from "~/lib/schema";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"]>) => ({
    label: data.name || "Details",
  }),
};

export async function action({ request }: Route.ActionArgs) {
  const { data, errors } = await getValidatedFormData<
    z.infer<typeof createSiteSchema>
  >(request, createSiteSchemaResolver);

  if (errors) {
    throw Response.json({ errors }, { status: 400 });
  }

  return api.sites.create(request, data);
}

export function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("No Client ID", { status: 400 });
  }

  return api.clients.get(request, id);
}

export default function AdminClientDetailsLayout() {
  return <Outlet />;
}
