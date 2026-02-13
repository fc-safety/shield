import {
  useRevalidator,
  useRouteLoaderData,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { api } from "~/.server/api";
import { ApiFetcher } from "~/.server/api-utils";
import { MembersTab } from "~/components/members/members-tab";
import type { Invitation } from "~/lib/types";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/members-tab";

interface InvitationsResponse {
  results: Invitation[];
  total: number;
  limit: number;
  offset: number;
}

export const shouldRevalidate = (arg: ShouldRevalidateFunctionArgs) => {
  const { formMethod, formAction } = arg;
  // Don't revalidate on DELETE unless it's members or invitations
  if (
    formMethod === "DELETE" &&
    formAction &&
    !formAction.startsWith("/api/proxy/members") &&
    !formAction.startsWith("/api/proxy/invitations")
  ) {
    return false;
  }
  return arg.defaultShouldRevalidate;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [memberResults, invitationsResponse] = await Promise.all([
    api.members.list(request, { limit: 10000 }),
    ApiFetcher.create(request, "/invitations", {
      limit: 100,
      status: "PENDING",
    }).get<InvitationsResponse>(),
  ]);

  // Filter to only pending invitations
  const pendingInvitations = invitationsResponse.results.filter((inv) => inv.status === "PENDING");

  return {
    members: memberResults.results,
    membersTotalCount: memberResults.count,
    pendingInvitations,
  };
};

export default function MembersTabRoute({
  loaderData: { members, membersTotalCount, pendingInvitations },
}: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/my-organization/layout");
  const { revalidate } = useRevalidator();

  return (
    <MembersTab
      members={members}
      membersTotalCount={membersTotalCount}
      sites={layoutData?.sites ?? []}
      clientId={layoutData?.client?.id}
      pendingInvitations={pendingInvitations}
      onInvitationCreated={() => revalidate()}
      onInvitationRevoked={() => revalidate()}
      onMemberRemoved={() => revalidate()}
    />
  );
}
