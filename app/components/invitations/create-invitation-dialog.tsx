import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Copy, MailCheck, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createInvitationSchema } from "~/lib/schema";
import type { Invitation } from "~/lib/types";
import { cn } from "~/lib/utils";
import RoleCombobox from "../clients/role-combobox";
import SiteCombobox from "../clients/site-combobox";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { extractErrorMessage, Form as FormProvider } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type TForm = z.infer<typeof createInvitationSchema>;

interface CreateInvitationDialogProps {
  clientId?: string;
  trigger?: React.ReactNode;
  onCreated?: (invitation: Invitation) => void;
}

const FORM_DEFAULTS: TForm = {
  email: "",
  roleId: "",
  siteId: "",
  expiresInDays: 7,
};

function CreatedInvitationDisplay({
  invitation,
  onClose,
}: {
  invitation: Invitation;
  onClose: () => void;
}) {
  // Construct invite URL - need code to be present
  const hasValidCode = invitation.code && invitation.code !== "undefined";
  const inviteUrl = hasValidCode
    ? invitation.inviteUrl || `${window.location.origin}/accept-invite/${invitation.code}`
    : null;

  // Format expiration date safely
  const expiresDate = invitation.expiresOn ? new Date(invitation.expiresOn) : null;
  const expiresFormatted =
    expiresDate && !isNaN(expiresDate.getTime()) ? expiresDate.toLocaleDateString() : null;

  const copyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <div className="min-w-0 space-y-4 pt-4">
      <div className="bg-muted/50 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <MailCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Invitation sent to <strong>{invitation.email ?? "the provided address"}</strong>
            </p>
            <p className="text-muted-foreground text-sm">
              The recipient needs to open the email and accept the invitation to join.
            </p>
          </div>
        </div>
      </div>

      {expiresFormatted && (
        <p className="text-muted-foreground text-sm">Expires: {expiresFormatted}</p>
      )}

      {inviteUrl && (
        <Collapsible>
          <CollapsibleTrigger className="text-muted-foreground flex items-center gap-1 text-sm hover:underline [&[data-state=open]>svg]:rotate-180">
            <ChevronDown className="h-4 w-4 transition-transform" />
            You can also share the link directly
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 flex items-center gap-2">
              <code className="bg-muted flex-1 truncate rounded px-2 py-1 text-sm">
                {inviteUrl}
              </code>
              <Button size="sm" variant="outline" onClick={copyInviteLink}>
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

export function CreateInvitationDialog({
  clientId,
  trigger,
  onCreated,
}: CreateInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null);

  const form = useForm({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const { reset } = form;

  const { submitJson, isSubmitting } = useModalFetcher<Invitation | { data: Invitation }>({
    onSubmitted: (response) => {
      // Handle both direct response and wrapped response (e.g., { data: invitation })
      const invitation =
        "data" in response && response.data ? response.data : (response as Invitation);
      setCreatedInvitation(invitation);
      onCreated?.(invitation);
    },
  });

  const handleSubmit = (data: TForm) => {
    // Build payload, filtering out empty/undefined values for JSON compatibility
    const payload: Record<string, string | number> = {
      expiresInDays: data.expiresInDays,
    };
    if (clientId) payload.clientId = clientId;
    if (data.email) payload.email = data.email;
    if (data.roleId) payload.roleId = data.roleId;
    if (data.siteId) payload.siteId = data.siteId;

    submitJson(payload, {
      method: "POST",
      path: "/api/proxy/invitations",
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form and created invitation when closing
      reset(FORM_DEFAULTS);
      setCreatedInvitation(null);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Invite Member
          </Button>
        )
      }
      dialogClassName="sm:max-w-lg"
      disableDisplayTable
      title={createdInvitation ? "Invitation Created" : "Invite Member"}
      description={
        createdInvitation
          ? "An invitation email has been sent."
          : "Invite someone to join your organization."
      }
    >
      {createdInvitation ? (
        <CreatedInvitationDisplay
          invitation={createdInvitation}
          onClose={() => handleOpenChange(false)}
        />
      ) : (
        <FormProvider {...form}>
          <form
            className="space-y-4 pt-4"
            onSubmit={form.handleSubmit(handleSubmit, (e) => {
              toast.error("Please fix the errors in the form.", {
                description: extractErrorMessage(e),
                duration: 10000,
              });
            })}
          >
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    {...field}
                    type="email"
                    inputMode="email"
                    placeholder="user@example.com"
                    required
                  />
                  <FieldDescription>
                    The invitation will be sent to this email address.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="roleId"
              render={({ field: { value, onChange }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Role</FieldLabel>
                  <RoleCombobox value={value} onValueChange={onChange} className="w-full" />
                  <FieldDescription>
                    The role assigned to this member when they join.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="siteId"
              render={({ field: { value, onChange }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Site</FieldLabel>
                  <SiteCombobox
                    value={value}
                    onValueChange={onChange}
                    clientId={clientId}
                    className="w-full"
                  />
                  <FieldDescription>
                    The site assigned to this member when they join.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="expiresInDays"
              render={({ field: { value, onChange }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Expires In</FieldLabel>
                  <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
                    <SelectTrigger className={cn("w-full")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </FormProvider>
      )}
    </ResponsiveDialog>
  );
}
