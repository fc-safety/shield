import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Copy, MailCheck, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Controller, useFieldArray, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createInvitationsSchema } from "~/lib/schema";
import type { Invitation, Role } from "~/lib/types";
import { cn } from "~/lib/utils";
import RoleCombobox from "../clients/role-combobox";
import SiteCombobox from "../clients/site-combobox";
import ConfirmationDialog from "../confirmation-dialog";
import { ResponsiveDialog } from "../responsive-dialog";
import RoleOverviewTable from "../roles/role-overview-table";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { extractErrorMessage, Form as FormProvider } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type TForm = z.infer<typeof createInvitationsSchema>;

interface CreateInvitationDialogProps {
  clientId?: string;
  trigger?: React.ReactNode;
  onCreated?: (invitations: Invitation[]) => void;
}

const FORM_DEFAULTS: TForm = {
  expiresInDays: 7,
  invitations: [{ email: "", roleId: "", siteId: "" }],
};

// Stable callback reference is required — RoleCombobox fires onRoleChange
// inside a useEffect that depends on the callback identity.
const InvitationRow = memo(function InvitationRow({
  index,
  control,
  clientId,
  onRoleChange,
  onRemove,
  canRemove,
}: {
  index: number;
  control: Control<TForm>;
  clientId?: string;
  onRoleChange: (index: number, role: Role | undefined) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  const handleRoleChange = useCallback(
    (role: Role | undefined) => onRoleChange(index, role),
    [onRoleChange, index]
  );

  return (
    <TableRow>
      <TableCell>
        <Controller
          control={control}
          name={`invitations.${index}.email`}
          render={({ field, fieldState }) => (
            <div>
              <Input
                {...field}
                type="email"
                inputMode="email"
                placeholder="user@example.com"
                className={cn(fieldState.invalid && "border-destructive")}
              />
              {fieldState.error && (
                <p className="text-destructive mt-1 text-xs">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          control={control}
          name={`invitations.${index}.roleId`}
          render={({ field: { value, onChange }, fieldState }) => (
            <div>
              <RoleCombobox
                value={value}
                onValueChange={onChange}
                onRoleChange={handleRoleChange}
                className="w-full"
              />
              {fieldState.error && (
                <p className="text-destructive mt-1 text-xs">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          control={control}
          name={`invitations.${index}.siteId`}
          render={({ field: { value, onChange }, fieldState }) => (
            <div>
              <SiteCombobox
                value={value}
                onValueChange={onChange}
                clientId={clientId}
                className="w-full"
              />
              {fieldState.error && (
                <p className="text-destructive mt-1 text-xs">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          aria-label={`Remove invitation row ${index + 1}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

function CreatedInvitationsDisplay({
  invitations,
  onClose,
}: {
  invitations: Invitation[];
  onClose: () => void;
}) {
  const single = invitations.length === 1 ? invitations[0] : null;

  // For single invitation, show copy-link option
  const inviteUrl =
    single?.code && single.code !== "undefined"
      ? single.inviteUrl || `${window.location.origin}/accept-invite/${single.code}`
      : null;

  const expiresDate = single?.expiresOn ? new Date(single.expiresOn) : null;
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
            {single ? (
              <>
                <p className="text-sm font-medium">
                  Invitation sent to <strong>{single.email ?? "the provided address"}</strong>
                </p>
                <p className="text-muted-foreground text-sm">
                  The recipient needs to open the email and accept the invitation to join.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  <strong>{invitations.length}</strong> invitations sent successfully
                </p>
                <ul className="text-muted-foreground mt-1 list-inside list-disc text-sm">
                  {invitations.map((inv) => (
                    <li key={inv.id}>{inv.email ?? "unknown"}</li>
                  ))}
                </ul>
              </>
            )}
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

const HIGH_PRIVILEGE_SCOPES = ["GLOBAL", "SYSTEM"] as const;

function buildHighPrivilegeConfirmation(
  data: TForm,
  selectedRoles: Map<number, Role>
): { title: string; message: string; emails: string[] } | null {
  const privilegedRows: { email: string; role: Role }[] = [];

  for (let i = 0; i < data.invitations.length; i++) {
    const row = data.invitations[i];
    const role = selectedRoles.get(i);
    if (
      role &&
      role.id === row.roleId &&
      HIGH_PRIVILEGE_SCOPES.includes(role.scope as (typeof HIGH_PRIVILEGE_SCOPES)[number])
    ) {
      privilegedRows.push({ email: row.email, role });
    }
  }

  if (privilegedRows.length === 0) return null;

  const hasSystem = privilegedRows.some((r) => r.role.scope === "SYSTEM");
  const emails = privilegedRows.map((r) => r.email);

  if (privilegedRows.length === 1) {
    const { role } = privilegedRows[0];
    const scope = role.scope === "SYSTEM" ? "System" : "Global";
    return {
      title: `Invite with ${scope} Admin Role`,
      message:
        role.scope === "SYSTEM"
          ? "Are you sure you want to invite this member with a system admin role? Doing so will give them full access to admin controls and the ability to view and manage data for all clients."
          : "Are you sure you want to invite this member with a global admin role? Doing so will give them full access to view and manage data for all clients.",
      emails,
    };
  }

  return {
    title: "Invite with High-Privilege Roles",
    message: hasSystem
      ? `You are about to invite ${privilegedRows.length} members with elevated roles. This will give them full access to admin controls and the ability to view and manage data for all clients.`
      : `You are about to invite ${privilegedRows.length} members with global admin roles. This will give them full access to view and manage data for all clients.`,
    emails,
  };
}

export function CreateInvitationDialog({
  clientId,
  trigger,
  onCreated,
}: CreateInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [createdInvitations, setCreatedInvitations] = useState<Invitation[] | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Map<number, Role>>(new Map());
  const [assignHighPrivilegeAction, setAssignHighPrivilegeAction] = useConfirmAction({});

  const form = useForm<TForm>({
    resolver: zodResolver(createInvitationsSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const { reset, control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invitations",
  });

  const { submitJson, isSubmitting } = useModalFetcher<Invitation | Invitation[] | { data: Invitation | Invitation[] }>({
    onSubmitted: (response) => {
      const data = "data" in response && response.data ? response.data : response;
      const list = Array.isArray(data) ? data : [data as Invitation];
      setCreatedInvitations(list);
      onCreated?.(list);
    },
  });

  const doSubmit = (data: TForm) => {
    submitJson(
      {
        expiresInDays: data.expiresInDays,
        invitations: data.invitations,
        clientId: clientId ?? null,
      },
      {
        method: "POST",
        path: "/api/proxy/invitations",
      }
    );
  };

  const handleSubmit = (data: TForm) => {
    const confirmation = buildHighPrivilegeConfirmation(data, selectedRoles);
    if (confirmation) {
      const emailList = confirmation.emails.join(", ");
      setAssignHighPrivilegeAction((draft) => {
        draft.open = true;
        draft.title = confirmation.title;
        draft.message = confirmation.message;
        draft.requiredUserInput = emailList;
        draft.requiredUserInputPrompt = `Please type "${emailList}" to confirm:`;
        draft.onConfirm = () => doSubmit(data);
      });
      return;
    }
    doSubmit(data);
  };

  const handleRemoveRow = useCallback(
    (index: number) => {
      remove(index);
      setSelectedRoles((prev) => {
        const next = new Map<number, Role>();
        for (const [key, value] of prev) {
          if (key < index) next.set(key, value);
          else if (key > index) next.set(key - 1, value);
        }
        return next;
      });
    },
    [remove]
  );

  const handleRoleChange = useCallback((index: number, role: Role | undefined) => {
    setSelectedRoles((prev) => {
      const next = new Map(prev);
      if (role) {
        next.set(index, role);
      } else {
        next.delete(index);
      }
      return next;
    });
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset(FORM_DEFAULTS);
      setCreatedInvitations(null);
      setSelectedRoles(new Map());
    }
  };

  const invitationCount = fields.length;

  return (
    <>
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
        dialogClassName="sm:max-w-4xl"
        disableDisplayTable
        title={createdInvitations ? "Invitations Created" : "Invite Members"}
        description={
          createdInvitations
            ? "Invitation emails have been sent."
            : "Invite people to join your organization."
        }
      >
        {createdInvitations ? (
          <CreatedInvitationsDisplay
            invitations={createdInvitations}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Email</TableHead>
                    <TableHead className="w-[25%]">Role</TableHead>
                    <TableHead className="w-[25%]">Site</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <InvitationRow
                      key={field.id}
                      index={index}
                      control={control}
                      clientId={clientId}
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemoveRow}
                      canRemove={fields.length > 1}
                    />
                  ))}
                </TableBody>
              </Table>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ email: "", roleId: "", siteId: "" })}
              >
                <Plus className="h-4 w-4" />
                Add Another
              </Button>

              <RoleOverviewTable />

              <Controller
                control={control}
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
                  {isSubmitting
                    ? "Sending..."
                    : invitationCount === 1
                      ? "Send Invitation"
                      : `Send ${invitationCount} Invitations`}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </ResponsiveDialog>
      <ConfirmationDialog {...assignHighPrivilegeAction} />
    </>
  );
}
