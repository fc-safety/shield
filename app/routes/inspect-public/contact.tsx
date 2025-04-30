import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/contact";
export const handle = {
  breadcrumb: () => ({ label: "Contact" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export default function Contact() {
  return <>Contact</>;
}
