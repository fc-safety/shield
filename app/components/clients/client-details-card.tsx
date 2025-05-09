import { format, isAfter } from "date-fns";
import { Building2, Pencil } from "lucide-react";
import { useAuth } from "~/contexts/auth-context";
import type { Client } from "~/lib/models";
import { can } from "~/lib/users";
import { beautifyPhone } from "~/lib/utils";
import ActiveIndicator2 from "../active-indicator-2";
import { CopyableText } from "../copyable-text";
import DataList from "../data-list";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import EditClientButton from "./edit-client-button";

export default function ClientDetailsCard({
  title = "Client Details",
  client,
}: {
  title?: string;
  client: Client | undefined;
}) {
  const { user } = useAuth();
  const canEditClient = can(user, "update", "clients");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Building2 />
          <div className="inline-flex items-center gap-4">
            {title}
            <div className="flex gap-2">
              {canEditClient && (
                <EditClientButton
                  client={client}
                  trigger={
                    <Button variant="secondary" size="icon" type="button">
                      <Pencil />
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        {client ? (
          <>
            <div className="grid gap-4">
              <Label>Properties</Label>
              <DataList
                details={[
                  {
                    label: "Status",
                    value: (
                      <div className="capitalize flex items-center gap-2">
                        <ActiveIndicator2
                          active={
                            client.status.toLowerCase() as Lowercase<
                              Client["status"]
                            >
                          }
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
                  },
                  {
                    label: isAfter(client.startedOn, new Date())
                      ? "Starts On"
                      : "Started On",
                    value: format(client.startedOn, "PP"),
                  },
                  {
                    label: "Default Inspection Cycle",
                    value: `${client.defaultInspectionCycle} days`,
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
            <div className="grid gap-4">
              <Label>Contact</Label>
              <DataList
                details={[
                  {
                    label: "Address",
                    value: (
                      <span>
                        {client.address.street1}
                        <br />
                        {client.address.street2 && (
                          <>
                            {client.address.street2}
                            <br />
                          </>
                        )}
                        {client.address.city}, {client.address.state}{" "}
                        {client.address.zip}
                      </span>
                    ),
                  },
                  {
                    label: "Phone Number",
                    value: beautifyPhone(client.phoneNumber),
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
            <div className="grid gap-4">
              <Label>Other</Label>
              <DataList
                details={[
                  {
                    label: "Created",
                    value: format(client.createdOn, "PPpp"),
                  },
                  {
                    label: "Last Updated",
                    value: format(client.modifiedOn, "PPpp"),
                  },
                ]}
                defaultValue={<>&mdash;</>}
              />
            </div>
          </>
        ) : (
          <Skeleton className="h-64 w-full rounded" />
        )}
      </CardContent>
    </Card>
  );
}
