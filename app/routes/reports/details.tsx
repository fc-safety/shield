import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/details";

export const handle = {
  breadcrumb: () => ({ label: "Details" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export default function ReportDetails() {
  return <>Report Details</>;
}
