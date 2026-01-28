import { useRevalidator, useRouteLoaderData } from "react-router";
import { ApiFetcher } from "~/.server/api-utils";
import { CreateInvitationDialog } from "~/components/invitations/create-invitation-dialog";
import { InvitationsTable } from "~/components/invitations/invitations-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Invitation } from "~/lib/types";
import type { loader as layoutLoader } from "../layout";
import type { Route } from "./+types/invitations-tab";

interface InvitationsResponse {
  results: Invitation[];
  total: number;
  limit: number;
  offset: number;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const invitationsResponse = await ApiFetcher.create(request, "/invitations", {
    limit: 100,
  }).get<InvitationsResponse>();

  return {
    invitations: invitationsResponse.results,
    totalCount: invitationsResponse.total,
  };
};

export default function InvitationsTab({
  loaderData: { invitations, totalCount },
}: Route.ComponentProps) {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/my-organization/layout");
  const { revalidate } = useRevalidator();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Invitations
            {totalCount > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-normal text-muted-foreground">
                {totalCount}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Invite users to join your organization. They will receive a link to accept the
            invitation.
          </CardDescription>
        </div>
        <CreateInvitationDialog
          clientId={layoutData?.client?.id}
          onCreated={() => revalidate()}
        />
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No invitations yet.</p>
            <p className="text-sm">Create an invitation to invite users to your organization.</p>
          </div>
        ) : (
          <InvitationsTable invitations={invitations} onInvitationRevoked={() => revalidate()} />
        )}
      </CardContent>
    </Card>
  );
}
