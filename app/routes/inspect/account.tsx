import { requireUserSession } from "~/.server/user-sesssion";
import AccountCard from "~/components/account/AccountCard";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "../+types/account";

export const handle = {
  breadcrumb: () => ({ label: "Account" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = await requireUserSession(request);
  return { user };
};

export default function Account({
  loaderData: { user },
}: Route.ComponentProps) {
  return <AccountCard user={user} />;
}
