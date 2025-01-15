import { Outlet, type UIMatch } from "react-router";
import type { z } from "zod";
import { api } from "~/.server/api";
import { createSiteSchemaResolver, type createSiteSchema } from "~/lib/schema";
import {
  buildTitleFromBreadcrumb,
  getValidatedFormDataOrThrow,
  validateParam,
} from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"]>) => ({
    label: data?.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export async function action({ request }: Route.ActionArgs) {
  const { data } = await getValidatedFormDataOrThrow<
    z.infer<typeof createSiteSchema>
  >(request, createSiteSchemaResolver);

  return api.sites.create(request, data);
}

export function loader({ params, request }: Route.LoaderArgs) {
  const id = validateParam(params, "id");

  return api.clients.get(request, id);
}

export default function AdminClientDetailsLayout() {
  return <Outlet />;
}
