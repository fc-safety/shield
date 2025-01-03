import { Outlet } from "react-router";
import { getClient } from "~/.server/api";
import type { Route } from "./+types/layout";

export const handle = {
  breadcrumb: ({ data }: Route.MetaArgs) => ({
    label: data.name || "Details",
  }),
};

export function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Response("No Client ID", { status: 400 });
  }

  return getClient(request, id);
}

export default function AdminClientDetailsLayout() {
  return <Outlet />;
}
