import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ViewContext } from "~/.server/api-utils";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { VISIBILITY } from "~/lib/permissions";
import type { ClientUser, Role, UserRole } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import ConfirmationDialog from "../confirmation-dialog";
import RoleCombobox from "./role-combobox";

interface UpdateUserRoleFormProps {
  user: ClientUser;
  clientId: string;
  onSubmitted?: () => void;
  viewContext?: ViewContext;
}

export default function UpdateUserRoleForm({
  user,
  clientId,
  onSubmitted,
  viewContext,
}: UpdateUserRoleFormProps) {
  // Get current roles from user, fallback to roleName for backward compatibility
  const initialRoles = useMemo(() => {
    if (user.roles && user.roles.length > 0) {
      return user.roles;
    }
    if (user.roleName) {
      // Create a dummy role from the legacy roleName
      return [{ id: "", name: user.roleName, permissions: [] }] as UserRole[];
    }
    return [] as UserRole[];
  }, [user.roles, user.roleName]);

  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>(initialRoles);
  const [roleToAdd, setRoleToAdd] = useState<string | undefined>();
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState<Role | undefined>();
  const [assignGlobalAdminAction, setAssignGlobalAdminAction] = useConfirmAction({});

  const { submitJson: submitAddRole, isSubmitting: isAddingRole } = useModalFetcher({
    onSubmitted: (newRole: UserRole) => {
      // Add the new role to the assigned roles list
      setAssignedRoles((prev) => [...prev, newRole]);
      setRoleToAdd(undefined);
      setSelectedRoleForAdd(undefined);
      onSubmitted?.();
    },
  });

  const { submitJson: submitRemoveRole, isSubmitting: isRemovingRole } = useModalFetcher({
    onSubmitted: (removedRoleId: string) => {
      // Remove the role from the assigned roles list
      setAssignedRoles((prev) => prev.filter((r) => r.id !== removedRoleId));
      onSubmitted?.();
    },
  });

  const handleAddRole = useCallback(() => {
    if (!roleToAdd) return;

    const doAdd = () => {
      submitAddRole(
        { roleId: roleToAdd },
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
      selectedRoleForAdd.permissions.some(
        (p) => p === VISIBILITY.GLOBAL || p === VISIBILITY.SUPER_ADMIN
      )
    ) {
      if (selectedRoleForAdd.permissions.some((p) => p === VISIBILITY.GLOBAL)) {
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
      } else if (selectedRoleForAdd.permissions.some((p) => p === VISIBILITY.SUPER_ADMIN)) {
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
    roleToAdd,
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
      submitRemoveRole(roleId, {
        method: "DELETE",
        path: buildPath(`/api/proxy/users/:userId/roles/:roleId`, {
          userId: user.id,
          roleId,
        }),
        query: {
          clientId,
        },
        viewContext,
      });
    },
    [user.id, clientId, viewContext, submitRemoveRole]
  );

  const isSubmitting = isAddingRole || isRemovingRole;

  return (
    <>
      <div className="space-y-6">
        {/* Display current roles */}
        <div className="space-y-2">
          <FormLabel>Assigned Roles</FormLabel>
          {assignedRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles assigned</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedRoles.map((role) => (
                <Badge key={role.id} variant="secondary" className="pl-3 pr-1">
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
        <div className="space-y-2">
          <FormLabel>Add Role</FormLabel>
          <div className="flex gap-2">
            <RoleCombobox
              value={roleToAdd}
              onValueChange={setRoleToAdd}
              className="flex-1"
              excludeRoles={assignedRoles.map((r) => r.id)}
              onRoleChange={setSelectedRoleForAdd}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              onClick={handleAddRole}
              disabled={!roleToAdd || isSubmitting}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
      <ConfirmationDialog {...assignGlobalAdminAction} />
    </>
  );
}
