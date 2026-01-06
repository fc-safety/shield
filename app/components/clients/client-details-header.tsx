import { zodResolver } from "@hookform/resolvers/zod";
import { CopyPlus, Loader2, Pencil, ShieldCheck, Warehouse } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import ActiveIndicatorBadge from "~/components/active-indicator-badge";
import EditClientButton from "~/components/clients/edit-client-button";
import DisplayAddress from "~/components/display-address";
import { Button } from "~/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "~/components/ui/button-group";
import { Card, CardHeader } from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import { useViewContext } from "~/contexts/view-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { useOpenData } from "~/hooks/use-open-data";
import type { Client } from "~/lib/models";
import { can, isGlobalAdmin } from "~/lib/users";
import { ResponsiveDialog } from "../responsive-dialog";
import { Badge } from "../ui/badge";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";

export default function ClientDetailsHeader({ client }: { client: Client }) {
  const { user } = useAuth();
  const viewContext = useViewContext();
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const canEditClient = can(user, "update", "clients");
  const duplicateDemoClient = useOpenData();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <h2 className="inline-flex flex-wrap-reverse items-center gap-x-2 text-xl font-semibold @lg:text-2xl">
              {client.name}
            </h2>
            <DisplayAddress
              address={client.address}
              className="text-muted-foreground text-sm @lg:whitespace-normal"
            />
            {client._count && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline">
                  <ShieldCheck className="text-primary" />
                  {client._count.assets} asset{client._count.assets === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline">
                  <Warehouse className="text-primary" />
                  {client._count.sites} site{client._count.sites === 1 ? "" : "s"}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {viewContext === "admin" && (
              <ActiveIndicatorBadge
                active={client.status.toLowerCase() as Lowercase<Client["status"]>}
              />
            )}
            <ButtonGroup>
              {viewContext === "admin" && canEditClient && (
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
                <>
                  {canEditClient && <ButtonGroupSeparator />}
                  <Button
                    variant="secondary"
                    size="icon"
                    type="button"
                    title="Duplicate Demo Client"
                    onClick={() => duplicateDemoClient.openNew()}
                  >
                    <CopyPlus />
                  </Button>
                </>
              )}
            </ButtonGroup>
          </div>
        </div>

        {/* Duplicate Demo Client Dialog */}
        {userIsGlobalAdmin && client?.demoMode && (
          <DuplicateDemoClientDialog
            client={client}
            open={duplicateDemoClient.open}
            onOpenChange={duplicateDemoClient.setOpen}
          />
        )}
      </CardHeader>
    </Card>
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
  const form = useForm({
    resolver: zodResolver(duplicateDemoClientSchema),
    defaultValues: {
      name: "(Copy of) " + client.name,
      password: "safetydemo1",
    },
  });

  const navigate = useNavigate();

  const { submitJson: submitDuplicateDemoClient, isSubmitting } = useModalFetcher<
    DataOrError<Client>
  >({
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
      viewContext: "admin",
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pt-4">
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
                <FormDescription>This will be the password for all new users.</FormDescription>
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
