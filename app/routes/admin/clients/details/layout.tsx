import { Outlet, type UIMatch } from "react-router";
import { api } from "~/.server/api";
import { buildTitleFromBreadcrumb, validateParam } from "~/lib/utils";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs | UIMatch<Route.MetaArgs["data"]>) => ({
    label: data?.name || "Details",
  }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export function loader({ params, request }: Route.LoaderArgs) {
  const id = validateParam(params, "id");

  return api.clients.get(request, id, { context: "admin" });
}

export default function AdminClientDetailsLayout() {
  return <Outlet />;
}
