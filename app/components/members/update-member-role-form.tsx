import { Button } from "@/components/ui/button";
import { Form as FormProvider } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Member, MemberClientAccess, Role } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import RoleCombobox from "../clients/role-combobox";
import SiteCombobox from "../clients/site-combobox";
import ConfirmationDialog from "../confirmation-dialog";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

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
  }, [form, selectedRoleForAdd, member.id, member.email, clientId, submitAddRole, setAssignHighPrivilegeAction]);

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
