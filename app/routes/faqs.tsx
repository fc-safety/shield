import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/faqs";

export const handle = {
  breadcrumb: () => ({ label: "FAQs" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export default function Faqs() {
  return <>Faqs</>;
}
