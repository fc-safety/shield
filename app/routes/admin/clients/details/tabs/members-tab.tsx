import { useRevalidator, type ShouldRevalidateFunctionArgs } from "react-router";
import { api } from "~/.server/api";
import { ApiFetcher } from "~/.server/api-utils";
import { MembersTab } from "~/components/members/members-tab";
import type { Invitation } from "~/lib/types";
import { validateParam } from "~/lib/utils";
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

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const clientId = validateParam(params, "id");

  const [memberResults, siteResults, invitationsResponse] = await Promise.all([
    api.members.list(request, { limit: 10000 }, { clientId }),
    api.sites.list(request, { limit: 10000 }, { clientId }),
    ApiFetcher.create(request, "/invitations", { limit: 100 }).get<InvitationsResponse>({
      clientId,
    }),
  ]);

  // Filter to only pending invitations
  const pendingInvitations = invitationsResponse.results.filter((inv) => inv.status === "PENDING");

  return {
    members: memberResults.results,
    membersTotalCount: memberResults.count,
    sites: siteResults.results,
    clientId,
    pendingInvitations,
  };
};

export default function MembersTabRoute({
  loaderData: { members, membersTotalCount, sites, clientId, pendingInvitations },
}: Route.ComponentProps) {
  const { revalidate } = useRevalidator();

  return (
    <MembersTab
      members={members}
      membersTotalCount={membersTotalCount}
      sites={sites}
      clientId={clientId}
      pendingInvitations={pendingInvitations}
      onInvitationCreated={() => revalidate()}
      onInvitationRevoked={() => revalidate()}
      onMemberRemoved={() => revalidate()}
    />
  );
}
