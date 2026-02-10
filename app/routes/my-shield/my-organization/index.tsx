import { CircleSlash } from "lucide-react";
import { redirect } from "react-router";
import { requireUserSession } from "~/.server/user-sesssion";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { CAPABILITIES } from "~/lib/permissions";
import { can, hasMultiSiteVisibility } from "~/lib/users";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);

  let tabId: string | null = null;
  const shouldWelcome = getSearchParam(request, "welcome") === "true";

  if (hasMultiSiteVisibility(user)) {
    tabId = "sites";
  } else if (can(user, CAPABILITIES.MANAGE_USERS)) {
    tabId = "members";
  } else if (can(user, CAPABILITIES.PERFORM_INSPECTIONS)) {
    tabId = "assets";
  } else if (can(user, CAPABILITIES.CONFIGURE_PRODUCTS)) {
    tabId = "products-questions";
  }

  if (tabId) {
    return redirect(`/my-organization/${tabId}?welcome=${shouldWelcome}`);
  }
};

export default function MyOrganizationIndex() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleSlash />
        </EmptyMedia>
        <EmptyTitle>No access</EmptyTitle>
        <EmptyDescription>
          You do not have permission to access any of the tabs in your organization.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
