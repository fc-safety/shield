import { isAfter, startOfDay } from "date-fns";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Client } from "~/lib/models";
import { isGlobalAdmin, isSystemsAdmin } from "~/lib/users";
import { beautifyPhone } from "~/lib/utils";
import ActiveIndicator2 from "../active-indicator-2";
import HydrationSafeFormattedDate from "../common/hydration-safe-formatted-date";
import ConfirmationDialog from "../confirmation-dialog";
import { CopyableText } from "../copyable-text";
import DataList from "../data-list";
import DisplayAddress from "../display-address";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export default function ClientDetailsCard({
  title = "Client Details",
  client,
}: {
  title?: string;
  client: Client | undefined;
}) {
  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const canDeleteClient = client && client.id !== user.activeClientId && isSystemsAdmin(user);

  const navigate = useNavigate();

  const { submitJson: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete client",
    onSubmitted: () => {
      navigate(`../`);
    },
  });

  const [deleteClientAction, setDeleteClientAction] = useConfirmAction({
    variant: "destructive",
    defaultProps: {
      title: "Delete Client",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Building2 />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        {client ? (
          <>
            <DataList
              title="Properties"
              details={[
                {
                  label: "Status",
                  value: (
                    <div className="flex items-center gap-2 capitalize">
                      <ActiveIndicator2
                        active={client.status.toLowerCase() as Lowercase<Client["status"]>}
                      />
                      {client.status.toLowerCase()}
                    </div>
                  ),
                },
                {
                  label: "Name",
                  value: client.name,
                },
                {
                  label: "External ID",
                  value: <CopyableText text={client.externalId} />,
                  hidden: !userIsGlobalAdmin,
                },
                {
                  label: isAfter(client.startedOn, startOfDay(new Date()))
                    ? "Starting On"
                    : "Started On",
                  value: <HydrationSafeFormattedDate date={client.startedOn} formatStr="PP" />,
                },
                {
                  label: "Default Inspection Cycle",
                  value: `${client.defaultInspectionCycle} days`,
                },
              ]}
              defaultValue={<>&mdash;</>}
              variant="thirds"
            />
            <DataList
              title="Contact"
              details={[
                {
                  label: "Address",
                  value: <DisplayAddress address={client.address} />,
                },
                {
                  label: "Phone Number",
                  value: beautifyPhone(client.phoneNumber),
                },
              ]}
              defaultValue={<>&mdash;</>}
              variant="thirds"
            />
            <DataList
              title="Other"
              details={[
                {
                  label: "Created",
                  value: <HydrationSafeFormattedDate date={client.createdOn} formatStr="PPpp" />,
                },
                {
                  label: "Last Updated",
                  value: <HydrationSafeFormattedDate date={client.modifiedOn} formatStr="PPpp" />,
                },
              ]}
              defaultValue={<>&mdash;</>}
              variant="thirds"
            />
          </>
        ) : (
          <Skeleton className="h-64 w-full rounded" />
        )}
        {canDeleteClient && (
          <Alert variant="destructive">
            <AlertTitle>Danger Zone</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              <p>
                Deleting this client may not be permitted if it is already in use and has data
                associated with it.
              </p>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() =>
                  setDeleteClientAction((draft) => {
                    draft.open = true;
                    draft.message = `Are you sure you want to delete "${client.name}"?`;
                    draft.requiredUserInput = client.name;
                    draft.onConfirm = () => {
                      submitDelete(
                        {},
                        {
                          method: "delete",
                          path: `/api/proxy/clients/${client.id}`,
                        }
                      );
                    };
                  })
                }
              >
                Delete Client
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <ConfirmationDialog {...deleteClientAction} />
    </Card>
  );
}
