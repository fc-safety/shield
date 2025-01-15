import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/settings";

export const handle = {
  breadcrumb: () => ({ label: "Settings" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export default function Settings() {
  return <>Settings</>;
}
