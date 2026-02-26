import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Client } from "~/lib/models";
import type { Role, UserResponse } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import ClientCombobox from "../clients/client-combobox";
import RoleCombobox from "../clients/role-combobox";
import SiteCombobox from "../clients/site-combobox";
import ResponsiveActions from "../common/responsive-actions";
import ConfirmationDialog from "../confirmation-dialog";
import { confirmHighPrivilegeRole } from "../roles/confirm-high-privilege-role";
import RoleOverviewTable from "../roles/role-overview-table";
import { Field, FieldLabel } from "../ui/field";

type ClientAccessEntry = UserResponse["clientAccess"][number];

interface ClientGroup {
  clientId: string;
  clientName: string;
  entries: ClientAccessEntry[];
}

const addRoleSchema = z.object({
  siteId: z.string().min(1, "Please select a site"),
  roleId: z.string().min(1, "Please select a role"),
});

type AddRoleForm = z.infer<typeof addRoleSchema>;

// ─── Main Component ──────────────────────────────────────────

interface ManageUserAccessFormProps {
  user: UserResponse;
}

export default function ManageUserAccessForm({ user }: ManageUserAccessFormProps) {
  const [accessList, setAccessList] = useState<ClientAccessEntry[]>(user.clientAccess);
  const [pendingClient, setPendingClient] = useState<{ id: string; name: string } | null>(null);
  const [showNewClientPicker, setShowNewClientPicker] = useState(false);

  const clientGroups = useMemo(() => {
    const groups = new Map<string, ClientGroup>();
    for (const entry of accessList) {
      const existing = groups.get(entry.client.id);
      if (existing) {
        existing.entries.push(entry);
      } else {
        groups.set(entry.client.id, {
          clientId: entry.client.id,
          clientName: entry.client.name,
          entries: [entry],
        });
      }
    }
    return Array.from(groups.values());
  }, [accessList]);

  const existingClientIds = useMemo(
    () => new Set(clientGroups.map((g) => g.clientId)),
    [clientGroups]
  );

  const handleAccessAdded = useCallback(
    (newEntry: ClientAccessEntry) => {
      setAccessList((prev) => [...prev, newEntry]);
      if (pendingClient && newEntry.client.id === pendingClient.id) {
        setPendingClient(null);
      }
    },
    [pendingClient]
  );

  const handleAccessRemoved = useCallback((entryId: string) => {
    setAccessList((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  return (
    <div className="space-y-6">
      <RoleOverviewTable />

      {showNewClientPicker ? (
        <NewClientPicker
          existingClientIds={existingClientIds}
          pendingClientId={pendingClient?.id}
          onSelect={(client) => {
            setPendingClient(client);
            setShowNewClientPicker(false);
          }}
          onCancel={() => setShowNewClientPicker(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNewClientPicker(true)}
          disabled={!!pendingClient}
        >
          <UserPlus />
          Join New Client
        </Button>
      )}

      {pendingClient && !existingClientIds.has(pendingClient.id) && (
        <ClientAccessGroupSection
          key={`pending-${pendingClient.id}`}
          user={user}
          clientId={pendingClient.id}
          clientName={pendingClient.name}
          entries={[]}
          isNew
          onAccessAdded={handleAccessAdded}
          onAccessRemoved={handleAccessRemoved}
          onCancel={() => setPendingClient(null)}
        />
      )}

      {clientGroups.map((group) => (
        <ClientAccessGroupSection
          key={group.clientId}
          user={user}
          clientId={group.clientId}
          clientName={group.clientName}
          entries={group.entries}
          onAccessAdded={handleAccessAdded}
          onAccessRemoved={handleAccessRemoved}
        />
      ))}

      {clientGroups.length === 0 && !pendingClient && (
        <p className="text-muted-foreground text-sm">This user has no organization access.</p>
      )}
    </div>
  );
}

// ─── Client Access Group Section ─────────────────────────────

interface ClientAccessGroupSectionProps {
  user: UserResponse;
  clientId: string;
  clientName: string;
  entries: ClientAccessEntry[];
  isNew?: boolean;
  onAccessAdded: (entry: ClientAccessEntry) => void;
  onAccessRemoved: (entryId: string) => void;
  onCancel?: () => void;
}

function ClientAccessGroupSection({
  user,
  clientId,
  clientName,
  entries,
  isNew,
  onAccessAdded,
  onAccessRemoved,
  onCancel,
}: ClientAccessGroupSectionProps) {
  const form = useForm<AddRoleForm>({
    resolver: zodResolver(addRoleSchema),
    defaultValues: { roleId: "", siteId: "" },
  });

  const {
    formState: { isValid, isDirty },
  } = form;

  const [showAddRow, setShowAddRow] = useState(!!isNew);
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<Role | undefined>();
  const [confirmAction, setConfirmAction] = useConfirmAction({});
  const [assignHighPrivilegeAction, setAssignHighPrivilegeAction] = useConfirmAction({});

  const { submitJson: submitAddRole, isSubmitting: isAddingRole } = useModalFetcher<
    DataOrError<ClientAccessEntry>
  >({});

  const { submitJson: submitRemoveRole, isSubmitting: isRemovingRole } = useModalFetcher<
    DataOrError<{ success: boolean }>
  >({});

  const isSubmitting = isAddingRole || isRemovingRole;
  const userName = `${user.firstName} ${user.lastName}`.trim();

  const watchedRoleId = form.watch("roleId");
  const watchedSiteId = form.watch("siteId");
  const isDuplicate =
    !!watchedRoleId &&
    !!watchedSiteId &&
    entries.some((e) => e.role.id === watchedRoleId && e.site.id === watchedSiteId);

  const handleAddRole = useCallback(() => {
    const { roleId, siteId } = form.getValues();
    if (!roleId || !siteId) {
      form.trigger();
      return;
    }

    const doAdd = () => {
      submitAddRole(
        { clientId, roleId, siteId },
        {
          method: "POST",
          path: buildPath(`/api/proxy/users/:id/roles`, { id: user.id }),
          accessIntent: "system",
          onSubmitted: (response) => {
            if (response.data) {
              onAccessAdded(response.data);
              form.reset();
              setShowAddRow(false);
            }
          },
        }
      );
    };

    if (
      selectedRoleForAdd &&
      selectedRoleForAdd.id === roleId &&
      confirmHighPrivilegeRole({
        role: selectedRoleForAdd,
        email: user.email,
        action: "add",
        setAction: setAssignHighPrivilegeAction,
        onConfirm: doAdd,
      })
    ) {
      return;
    }
    doAdd();
  }, [
    form,
    selectedRoleForAdd,
    user.id,
    user.email,
    clientId,
    submitAddRole,
    setAssignHighPrivilegeAction,
    onAccessAdded,
  ]);

  const handleRemoveRole = useCallback(
    (entry: ClientAccessEntry) => {
      const isLastRole = entries.length === 1;

      setConfirmAction((draft) => {
        draft.open = true;
        draft.destructive = true;

        if (isLastRole) {
          draft.title = "Remove from Organization";
          draft.message = (
            <>
              This is the last role for <span className="font-bold">{entry.client.name}</span>.
              Removing it will remove <span className="font-bold">{userName}</span> from this
              organization entirely.
            </>
          );
          draft.confirmText = "Remove from Organization";
        } else {
          draft.title = "Remove Role";
          draft.message = (
            <>
              Are you sure you want to remove the role{" "}
              <span className="font-bold">{entry.role.name}</span> for site{" "}
              <span className="font-bold">{entry.site.name}</span>?
            </>
          );
          draft.confirmText = "Remove";
        }

        draft.onConfirm = () => {
          submitRemoveRole(
            { clientId: entry.client.id, roleId: entry.role.id, siteId: entry.site.id },
            {
              method: "DELETE",
              path: buildPath(`/api/proxy/users/:id/roles`, { id: user.id }),
              accessIntent: "system",
              onSubmitted: () => onAccessRemoved(entry.id),
            }
          );
        };
      });
    },
    [entries.length, user.id, userName, submitRemoveRole, onAccessRemoved, setConfirmAction]
  );

  return (
    <div className="space-y-2">
      {/* Client header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">{clientName}</span>
        </div>
        {isNew && onCancel && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onCancel}>
            <X className="h-3 w-3" />
            <span className="sr-only">Cancel</span>
          </Button>
        )}
      </div>

      {/* Rows — disabled comboboxes for existing, editable for add-new */}
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SiteCombobox
                value={entry.site.id}
                clientId={clientId}
                readOnly
                showClear={false}
                placeholder="Site"
              />
            </div>
            <div className="min-w-0 flex-1">
              <RoleCombobox value={entry.role.id} readOnly placeholder="Role" />
            </div>
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "save",
                      text: "Save",
                      Icon: Check,
                      variant: "default",
                      disabled: true,
                    },
                    {
                      key: "remove",
                      text: "Remove",
                      Icon: Trash2,
                      variant: "destructive",
                      onAction: () => handleRemoveRole(entry),
                      pending: isRemovingRole,
                    },
                  ],
                },
              ]}
            />
          </div>
        ))}

        {/* Add new role row */}
        {showAddRow ? (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Controller
                control={form.control}
                name="siteId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <SiteCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      clientId={clientId}
                      disabled={isSubmitting}
                      showClear={false}
                      nestDrawers
                      placeholder="Select site..."
                    />
                  </Field>
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Controller
                control={form.control}
                name="roleId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <RoleCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      onRoleChange={setSelectedRoleForAdd}
                      disabled={isSubmitting}
                      placeholder="Select role..."
                    />
                  </Field>
                )}
              />
            </div>
            <ResponsiveActions
              actionGroups={[
                {
                  key: "actions",
                  actions: [
                    {
                      key: "save",
                      text: "Save",
                      Icon: Check,
                      variant: "default",
                      onAction: handleAddRole,
                      disabled: !isValid || !isDirty || isDuplicate,
                      pending: isAddingRole,
                    },
                    {
                      key: "clear",
                      text: "Clear",
                      Icon: X,
                      variant: "destructive",
                      onAction: () => {
                        form.reset();
                        setShowAddRow(false);
                      },
                      pending: isRemovingRole,
                    },
                  ],
                },
              ]}
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setShowAddRow(true)}
          >
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        )}
        {isDuplicate && (
          <p className="text-destructive text-xs">This role and site combination already exists.</p>
        )}
      </div>

      <ConfirmationDialog {...confirmAction} />
      <ConfirmationDialog {...assignHighPrivilegeAction} />
    </div>
  );
}

// ─── New Client Picker ───────────────────────────────────────

interface NewClientPickerProps {
  existingClientIds: Set<string>;
  pendingClientId?: string;
  onSelect: (client: { id: string; name: string }) => void;
  onCancel: () => void;
}

function NewClientPicker({
  existingClientIds,
  pendingClientId,
  onSelect,
  onCancel,
}: NewClientPickerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const isAlreadyAdded =
    !!selectedClientId &&
    (existingClientIds.has(selectedClientId) || selectedClientId === pendingClientId);

  return (
    <div className="flex flex-col gap-1">
      <Field className="flex-1">
        <FieldLabel className="text-muted-foreground text-xs">
          Which client will the user be joining?
        </FieldLabel>
        <div className="flex items-center gap-2">
          <ClientCombobox
            value={selectedClientId}
            onValueChange={setSelectedClientId}
            onClientChange={setSelectedClient}
            nestDrawers
            className="flex-1"
            placeholder="Select client..."
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (selectedClientId && selectedClient) {
                onSelect({ id: selectedClientId, name: selectedClient.name });
              }
            }}
            disabled={!selectedClientId || isAlreadyAdded}
          >
            Select
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Field>
      {isAlreadyAdded && (
        <p className="text-destructive text-xs">User already has access to this client.</p>
      )}
    </div>
  );
}
