import { Button } from "@/components/ui/button";
import { Form as FormProvider } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Capability, Member, MemberClientAccess, Role } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import RoleCombobox from "../clients/role-combobox";
import SiteCombobox from "../clients/site-combobox";
import ConfirmationDialog from "../confirmation-dialog";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const SCOPE_ORDER: Record<Role["scope"], number> = {
  SELF: 0,
  SITE: 1,
  SITE_GROUP: 2,
  CLIENT: 3,
  GLOBAL: 4,
  SYSTEM: 5,
};

const SCOPE_LABELS: Record<Role["scope"], string> = {
  SYSTEM: "System",
  GLOBAL: "Global (All Clients)",
  CLIENT: "Client (All Sites)",
  SITE_GROUP: "Site Group",
  SITE: "Single Site",
  SELF: "Self Only",
};

function RoleOverviewTable() {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  const {
    load: loadRoles,
    isLoading: isLoadingRoles,
    data: rolesData,
  } = useModalFetcher<DataOrError<Role[]>>({
    onData: (d) => setRoles(d.data ?? []),
  });

  const {
    load: loadCapabilities,
    isLoading: isLoadingCapabilities,
    data: capabilitiesData,
  } = useModalFetcher<DataOrError<Capability[]>>({
    onData: (d) => setCapabilities(d.data ?? []),
  });

  const isLoading = isLoadingRoles || isLoadingCapabilities;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      if (!rolesData) loadRoles({ path: "/api/proxy/roles" });
      if (!capabilitiesData) loadCapabilities({ path: "/api/proxy/roles/capabilities" });
    }
  };

  // Filter to non-global/system roles, sort by scope asc then capabilities count asc
  const sortedRoles = useMemo(
    () =>
      roles
        .filter((r) => r.scope !== "GLOBAL" && r.scope !== "SYSTEM")
        .sort((a, b) => {
          const scopeDiff = SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope];
          if (scopeDiff !== 0) return scopeDiff;
          return a.capabilities.length - b.capabilities.length;
        }),
    [roles]
  );

  // Union of all capabilities across filtered roles, ordered by capabilities list
  const allCapabilityNames = useMemo(() => {
    const set = new Set<string>();
    for (const role of sortedRoles) {
      for (const cap of role.capabilities) set.add(cap);
    }
    // Preserve the order from the capabilities endpoint
    if (capabilities.length > 0) {
      return capabilities.filter((c) => set.has(c.name));
    }
    return [...set].map((name) => ({ name, label: name, description: "" }));
  }, [sortedRoles, capabilities]);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-1.5 px-0"
        onClick={() => handleOpenChange(!open)}
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
        What does each role do?
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <p className="text-muted-foreground py-3 text-sm">Loading roles...</p>
            ) : sortedRoles.length === 0 ? (
              <p className="text-muted-foreground py-3 text-sm">No roles available.</p>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted text-muted-foreground sticky left-0 z-10" />
                      {sortedRoles.map((role) => (
                        <TableHead key={role.id} className="text-center whitespace-nowrap">
                          {role.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Scope row */}
                    <TableRow className="bg-muted/30">
                      <TableCell className="bg-muted text-muted-foreground sticky left-0 z-10 font-medium">
                        Scope
                      </TableCell>
                      {sortedRoles.map((role) => (
                        <TableCell
                          key={role.id}
                          className="text-muted-foreground text-center text-xs whitespace-nowrap"
                        >
                          {SCOPE_LABELS[role.scope]}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Capability rows */}
                    {allCapabilityNames.map((cap) => (
                      <TableRow key={cap.name}>
                        <TableCell
                          className="bg-muted text-muted-foreground sticky left-0 z-10 text-sm whitespace-nowrap"
                          title={cap.description}
                        >
                          {cap.label}
                        </TableCell>
                        {sortedRoles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            {role.capabilities.includes(cap.name) && (
                              <Check className="text-primary mx-auto h-4 w-4" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const addMemberRoleSchema = z.object({
  roleId: z.string().min(1, "Please select a role"),
  siteId: z.string().min(1, "Please select a site"),
});

type TForm = z.infer<typeof addMemberRoleSchema>;

interface UpdateMemberRoleFormProps {
  member: Member;
  clientId?: string;
}

const FORM_DEFAULTS = {
  roleId: "",
  siteId: "",
} satisfies TForm;

export default function UpdateMemberRoleForm({ member, clientId }: UpdateMemberRoleFormProps) {
  const form = useForm<TForm>({
    resolver: zodResolver(addMemberRoleSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const {
    formState: { isValid, isDirty },
  } = form;

  const assignedAccess = member.clientAccess;
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<Role | undefined>();
  const [confirmAction, setConfirmAction] = useConfirmAction({});
  const [assignHighPrivilegeAction, setAssignHighPrivilegeAction] = useConfirmAction({});

  const { submitJson: submitAddRole, isSubmitting: isAddingRole } = useModalFetcher<
    DataOrError<Member>
  >({});

  const { submitJson: submitRemoveRole, isSubmitting: isRemovingRole } = useModalFetcher<
    DataOrError<void>
  >({});

  const handleAddRole = useCallback(() => {
    const { roleId, siteId } = form.getValues();
    if (!roleId || !siteId) {
      form.trigger();
      return;
    }

    const doAdd = () => {
      submitAddRole(
        { roleId, siteId },
        {
          method: "POST",
          path: buildPath(`/api/proxy/members/:id/roles`, {
            id: member.id,
          }),
          query: {
            clientId,
          },
        }
      );
    };

    // Check if adding a high-privilege role
    if (
      selectedRoleForAdd &&
      selectedRoleForAdd.id === roleId &&
      (selectedRoleForAdd.scope === "GLOBAL" || selectedRoleForAdd.scope === "SYSTEM")
    ) {
      if (selectedRoleForAdd.scope === "GLOBAL") {
        setAssignHighPrivilegeAction((draft) => {
          draft.open = true;
          draft.title = "Add Global Admin Role";
          draft.message =
            "Are you sure you want to add a global admin role? Doing so will give the member full access to view and manage data for all clients.";
          draft.requiredUserInput = member.email;
          draft.onConfirm = () => {
            doAdd();
          };
        });
      } else if (selectedRoleForAdd.scope === "SYSTEM") {
        setAssignHighPrivilegeAction((draft) => {
          draft.open = true;
          draft.title = "Add System Admin Role";
          draft.message =
            "Are you sure you want to add a system admin role? Doing so will give the member full access to admin controls and the ability to view and manage data for all clients.";
          draft.requiredUserInput = member.email;
          draft.onConfirm = () => {
            doAdd();
          };
        });
      }
    } else {
      doAdd();
    }
  }, [
    form,
    selectedRoleForAdd,
    member.id,
    member.email,
    clientId,
    submitAddRole,
    setAssignHighPrivilegeAction,
  ]);

  const handleRemoveRole = useCallback(
    (access: MemberClientAccess) => {
      setConfirmAction((draft) => {
        draft.open = true;
        draft.title = "Remove Role";
        draft.message = (
          <>
            Are you sure you want to remove the role{" "}
            <span className="font-bold">{access.role.name}</span> for site{" "}
            <span className="font-bold">{access.site.name}</span>?
          </>
        );
        draft.destructive = true;
        draft.confirmText = "Remove";
        draft.onConfirm = () => {
          submitRemoveRole(
            { roleId: access.role.id, siteId: access.site.id },
            {
              method: "DELETE",
              path: buildPath(`/api/proxy/members/:id/roles`, {
                id: member.id,
              }),
              query: {
                clientId,
              },
            }
          );
        };
      });
    },
    [member.id, clientId, submitRemoveRole, setConfirmAction]
  );

  const isSubmitting = isAddingRole || isRemovingRole;

  return (
    <>
      <div className="space-y-6">
        {/* Role overview */}
        <RoleOverviewTable />

        {/* Display current roles as a table */}
        <div className="space-y-2">
          <FieldLabel>Assigned Roles</FieldLabel>
          {assignedAccess.length === 0 ? (
            <p className="text-muted-foreground text-sm">No roles assigned</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedAccess.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="font-medium">{access.role.name}</TableCell>
                      <TableCell>{access.site.name}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveRole(access)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                          <span className="sr-only">Remove role</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Add new role */}
        <FormProvider {...form}>
          <div className="space-y-4">
            <FieldLabel>Add Role</FieldLabel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Controller
                control={form.control}
                name="roleId"
                render={({ field, fieldState }) => (
                  <Field className="flex-1" data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-muted-foreground text-xs">Role</FieldLabel>
                    <RoleCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      onRoleChange={setSelectedRoleForAdd}
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="siteId"
                render={({ field, fieldState }) => (
                  <Field className="flex-1" data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-muted-foreground text-xs">Site</FieldLabel>
                    <SiteCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      clientId={clientId}
                      disabled={isSubmitting}
                      showClear={false}
                      nestDrawers
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Button
                type="button"
                onClick={handleAddRole}
                disabled={!isValid || !isDirty || isSubmitting}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </FormProvider>
      </div>
      <ConfirmationDialog {...confirmAction} />
      <ConfirmationDialog {...assignHighPrivilegeAction} />
    </>
  );
}
