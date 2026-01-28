import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Link2, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useViewContext } from "~/contexts/view-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createInvitationSchema } from "~/lib/schema";
import type { Invitation } from "~/lib/types";
import { cn } from "~/lib/utils";
import RoleCombobox from "../clients/role-combobox";
import SiteCombobox from "../clients/site-combobox";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { extractErrorMessage, Form as FormProvider } from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type TForm = z.infer<typeof createInvitationSchema>;

interface CreateInvitationDialogProps {
  clientId?: string;
  trigger?: React.ReactNode;
  onCreated?: (invitation: Invitation) => void;
}

const FORM_DEFAULTS: TForm = {
  email: "",
  roleId: undefined,
  siteId: undefined,
  expiresInDays: 7,
};

export function CreateInvitationDialog({
  clientId,
  trigger,
  onCreated,
}: CreateInvitationDialogProps) {
  const viewContext = useViewContext();
  const [open, setOpen] = useState(false);
  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null);

  const form = useForm({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const {
    formState: { isValid },
    reset,
  } = form;

  const { submitJson, isSubmitting } = useModalFetcher<Invitation>({
    onSubmitted: (invitation) => {
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
      viewContext,
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

  const copyInviteLink = async () => {
    if (createdInvitation?.inviteUrl) {
      await navigator.clipboard.writeText(createdInvitation.inviteUrl);
      toast.success("Invite link copied to clipboard");
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
            Create Invitation
          </Button>
        )
      }
      title={createdInvitation ? "Invitation Created" : "Create Invitation"}
      description={
        createdInvitation
          ? "Share this link with the person you want to invite."
          : "Invite someone to join your organization."
      }
    >
      {createdInvitation ? (
        <div className="space-y-4 pt-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              Invitation Link
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-background px-2 py-1 text-sm">
                {createdInvitation.inviteUrl}
              </code>
              <Button size="sm" variant="outline" onClick={copyInviteLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {createdInvitation.email && (
            <p className="text-sm text-muted-foreground">
              This invitation is restricted to: <strong>{createdInvitation.email}</strong>
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            Expires: {new Date(createdInvitation.expiresOn).toLocaleDateString()}
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
            <Button onClick={copyInviteLink}>
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>
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
                  <FieldLabel>Email (Optional)</FieldLabel>
                  <Input
                    {...field}
                    type="email"
                    inputMode="email"
                    placeholder="user@example.com"
                  />
                  <FieldDescription>
                    If provided, only this email can accept the invitation.
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
                  <FieldLabel>Role (Optional)</FieldLabel>
                  <RoleCombobox
                    value={value}
                    onValueChange={onChange}
                    className="w-full"
                    showClear
                  />
                  <FieldDescription>
                    Pre-assign a role when the invitation is accepted.
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
                  <FieldLabel>Site (Optional)</FieldLabel>
                  <SiteCombobox
                    value={value}
                    onValueChange={onChange}
                    clientId={clientId}
                    className="w-full"
                  />
                  <FieldDescription>
                    Pre-assign a site when the invitation is accepted.
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invitation"}
              </Button>
            </div>
          </form>
        </FormProvider>
      )}
    </ResponsiveDialog>
  );
}
