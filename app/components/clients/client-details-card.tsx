import { zodResolver } from "@hookform/resolvers/zod";
import { format, isAfter, startOfDay } from "date-fns";
import { Building2, CopyPlus, Loader2, Pencil } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Client } from "~/lib/models";
import { can, isGlobalAdmin } from "~/lib/users";
import { beautifyPhone } from "~/lib/utils";
import ActiveIndicator2 from "../active-indicator-2";
import ConfirmationDialog from "../confirmation-dialog";
import { CopyableText } from "../copyable-text";
import DataList from "../data-list";
import DisplayAddress from "../display-address";
import { ResponsiveDialog } from "../responsive-dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Input } from "../ui/input";
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
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const canEditClient = can(user, "update", "clients");
  const canDeleteClient =
    client &&
    client.externalId !== user.clientId &&
    can(user, "delete", "clients");

  const navigate = useNavigate();

  const { submit: submitDelete } = useModalFetcher({
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

  const duplicateDemoClient = useOpenData();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Building2 />
            <div className="inline-flex items-center gap-4">
              {title}
              {client?.demoMode && <Badge variant="default">Demo Client</Badge>}
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
                {userIsGlobalAdmin && client?.demoMode && (
                  <Button
                    variant="secondary"
                    size="icon"
                    type="button"
                    title="Duplicate Demo Client"
                    onClick={() => duplicateDemoClient.openNew()}
                  >
                    <CopyPlus />
                  </Button>
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
                      hidden: !userIsGlobalAdmin,
                    },
                    {
                      label: isAfter(client.startedOn, startOfDay(new Date()))
                        ? "Starting On"
                        : "Started On",
                      value: format(client.startedOn, "PP"),
                    },
                    {
                      label: "Default Inspection Cycle",
                      value: `${client.defaultInspectionCycle} days`,
                    },
                  ]}
                  defaultValue={<>&mdash;</>}
                  variant="thirds"
                />
              </div>
              <div className="grid gap-4">
                <Label>Contact</Label>
                <DataList
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
                  variant="thirds"
                />
              </div>
            </>
          ) : (
            <Skeleton className="h-64 w-full rounded" />
          )}
          {canDeleteClient && (
            <Alert variant="destructive">
              <AlertTitle>Danger Zone</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-2">
                <p>
                  Deleting this client may not be permitted if it is already in
                  use and has data associated with it.
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
                            action: `/api/proxy/clients/${client.id}`,
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
        {userIsGlobalAdmin && client?.demoMode && (
          <DuplicateDemoClientDialog
            client={client}
            open={duplicateDemoClient.open}
            onOpenChange={duplicateDemoClient.setOpen}
          />
        )}
      </Card>
    </>
  );
}

const duplicateDemoClientSchema = z.object({
  name: z.string().min(1),
  emailDomain: z.string().min(1),
  password: z.string().min(8),
});
type TDuplicateDemoClientForm = z.infer<typeof duplicateDemoClientSchema>;
function DuplicateDemoClientDialog({
  client,
  open,
  onOpenChange,
}: {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<TDuplicateDemoClientForm>({
    resolver: zodResolver(duplicateDemoClientSchema),
    defaultValues: {
      name: "(Copy of) " + client.name,
      password: "safetydemo1",
    },
  });

  const navigate = useNavigate();

  const { submitJson: submitDuplicateDemoClient, isSubmitting } =
    useModalFetcher<DataOrError<Client>>({
      defaultErrorMessage: "Error: Failed to duplicate demo client",
      onData: (data) => {
        if (data.data?.id) {
          navigate(`../${data.data.id}`);
          onOpenChange(false);
        }
      },
    });

  const onSubmit = (data: TDuplicateDemoClientForm) => {
    submitDuplicateDemoClient(data, {
      method: "post",
      path: `/api/proxy/clients/${client.id}/duplicate-demo`,
    });
  };

  return (
    <ResponsiveDialog
      title="Duplicate Demo Client"
      description="This will create a new client with the same sites and assets as the current client. Only for clients with demo mode enabled."
      open={open}
      onOpenChange={onOpenChange}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 pt-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Client Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailDomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Domain</FormLabel>
                <FormDescription>
                  This will be the new domain used for new user email addresses.
                </FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormDescription>
                  This will be the password for all new users.
                </FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <CopyPlus />}
            {isSubmitting ? "Duplicating..." : "Duplicate Client"}
          </Button>
        </form>
      </FormProvider>
    </ResponsiveDialog>
  );
}
