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
import { can } from "~/lib/users";
import type { Route } from "./+types/index";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);

  if (can(user, "read", "sites")) {
    return redirect("/my-organization/sites");
  }

  if (can(user, "read", "users")) {
    return redirect("/my-organization/sites");
  }

  if (can(user, "read", "assets")) {
    return redirect("/my-organization/assets");
  }

  if (can(user, "read", "products") || can(user, "read", "asset-questions")) {
    return redirect("/my-organization/products-questions");
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
