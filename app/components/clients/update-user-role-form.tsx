import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { DataOrError } from "~/.server/api-utils";
import { useViewContext } from "~/contexts/view-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { VISIBILITY } from "~/lib/permissions";
import { addUserRoleSchema } from "~/lib/schema";
import type { ClientUser, Role, UserRole } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import ConfirmationDialog from "../confirmation-dialog";
import RoleCombobox from "./role-combobox";

type TForm = z.infer<typeof addUserRoleSchema>;

interface UpdateUserRoleFormProps {
  user: ClientUser;
  clientId?: string;
}

const FORM_DEFAULTS = {
  roleId: "",
} satisfies TForm;

export default function UpdateUserRoleForm({ user, clientId }: UpdateUserRoleFormProps) {
  const viewContext = useViewContext();
  const form = useForm<TForm>({
    resolver: zodResolver(addUserRoleSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const {
    formState: { isValid, isDirty },
  } = form;

  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>(user.roles);
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<Role | undefined>();
  const [assignGlobalAdminAction, setAssignGlobalAdminAction] = useConfirmAction({});

  // Update assigned roles when user prop changes
  useEffect(() => {
    if (user.roles.length > 0) {
      setAssignedRoles(user.roles);
    }
  }, [user.roles]);

  const { submitJson: submitAddRole, isSubmitting: isAddingRole } = useModalFetcher<
    DataOrError<UserRole>
  >({
    onSubmitted: (data) => {
      // Add the new role to the assigned roles list
      const newRole = data.data;
      if (newRole) {
        setAssignedRoles((prev) => [...prev, newRole]);
        form.reset();
      }
      setSelectedRoleForAdd(undefined);
    },
  });

  const { submitJson: submitRemoveRole, isSubmitting: isRemovingRole } = useModalFetcher<
    DataOrError<string>
  >({
    onSubmitted: (data) => {
      const removedRoleId = data.data;
      if (removedRoleId !== undefined) {
        // Remove the role from the assigned roles list
        setAssignedRoles((prev) => prev.filter((r) => r.id !== removedRoleId));
      }
    },
  });

  const handleAddRole = useCallback(() => {
    const roleId = form.getValues("roleId");
    if (!roleId) {
      // form.trigger("roleId");
      return;
    }

    const doAdd = () => {
      submitAddRole(
        { roleId },
        {
          method: "POST",
          path: buildPath(`/api/proxy/users/:id/roles`, {
            id: user.id,
          }),
          query: {
            clientId,
          },
          viewContext,
        }
      );
    };

    // Check if adding a high-privilege role
    if (
      selectedRoleForAdd &&
      selectedRoleForAdd.id === roleId &&
      selectedRoleForAdd.capabilities.some(
        (p) => p === VISIBILITY.GLOBAL || p === VISIBILITY.SUPER_ADMIN
      )
    ) {
      if (selectedRoleForAdd.capabilities.some((p) => p === VISIBILITY.GLOBAL)) {
        setAssignGlobalAdminAction((draft) => {
          draft.open = true;
          draft.title = "Add Global Admin Role";
          draft.message =
            "Are you sure you want to add a global admin role? Doing so will give the user full access to view and manage data for all clients.";
          draft.requiredUserInput = user.email;
          draft.onConfirm = () => {
            doAdd();
          };
        });
      } else if (selectedRoleForAdd.capabilities.some((p) => p === VISIBILITY.SUPER_ADMIN)) {
        setAssignGlobalAdminAction((draft) => {
          draft.open = true;
          draft.title = "Add Super Admin Role";
          draft.message =
            "Are you sure you want to add a super admin role? Doing so will give the user full access to admin controls and the ability to view and manage data for all clients.";
          draft.requiredUserInput = user.email;
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
    user.id,
    user.email,
    clientId,
    viewContext,
    submitAddRole,
    setAssignGlobalAdminAction,
  ]);

  const handleRemoveRole = useCallback(
    (roleId: string) => {
      submitRemoveRole(
        {},
        {
          method: "DELETE",
          path: buildPath(`/api/proxy/users/:userId/roles/:roleId`, {
            userId: user.id,
            roleId,
          }),
          query: {
            clientId,
          },
          viewContext,
        }
      );
    },
    [user.id, clientId, viewContext, submitRemoveRole]
  );

  const isSubmitting = isAddingRole || isRemovingRole;

  return (
    <>
      <FormProvider {...form}>
        <div className="space-y-6">
          {/* Display current roles */}
          <div className="space-y-2">
            <FormLabel>Assigned Roles</FormLabel>
            {assignedRoles.length === 0 ? (
              <p className="text-muted-foreground text-sm">No roles assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedRoles.map((role) => (
                  <Badge key={role.id} variant="secondary" className="pr-1 pl-3">
                    {role.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-1 hover:bg-transparent"
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {role.name}</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Add new role */}
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add Role</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <RoleCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      className="flex-1"
                      excludeRoles={assignedRoles.map((r) => r.id)}
                      onRoleChange={setSelectedRoleForAdd}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    onClick={handleAddRole}
                    disabled={!isValid || !isDirty || isSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </FormProvider>
      <ConfirmationDialog {...assignGlobalAdminAction} />
    </>
  );
}
