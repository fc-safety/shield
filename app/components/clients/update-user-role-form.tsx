import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ViewContext } from "~/.server/api-utils";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { VISIBILITY } from "~/lib/permissions";
import {
  assignUserRoleSchemaResolver,
  type assignUserRoleSchema,
} from "~/lib/schema";
import type { ClientUser, Role } from "~/lib/types";
import { buildPath } from "~/lib/urls";
import ConfirmationDialog from "../confirmation-dialog";
import RoleCombobox from "./role-combobox";

type TForm = z.infer<typeof assignUserRoleSchema>;

interface UpdateUserRoleFormProps {
  user: ClientUser;
  clientId: string;
  onSubmitted?: () => void;
  viewContext?: ViewContext;
}

const FORM_DEFAULTS = {
  roleId: "",
} satisfies TForm;

export default function UpdateUserRoleForm({
  user,
  clientId,
  onSubmitted,
  viewContext,
}: UpdateUserRoleFormProps) {
  const form = useForm<TForm>({
    resolver: assignUserRoleSchemaResolver,
    defaultValues: FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { submitJson: submitUserRole, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [assignGlobalAdminAction, setAssignGlobalAdminAction] =
    useConfirmAction({});

  const handleSubmit = (data: TForm) => {
    const doSubmit = () =>
      submitUserRole(data, {
        method: "POST",
        path: buildPath(`/api/proxy/users/:id/assign-role`, {
          id: user.id,
        }),
        query: {
          clientId,
        },
        viewContext,
      });

    if (
      selectedRole &&
      selectedRole.id === data.roleId &&
      selectedRole.permissions.some(
        (p) => p === VISIBILITY.GLOBAL || p === VISIBILITY.SUPER_ADMIN
      )
    ) {
      if (selectedRole.permissions.some((p) => p === VISIBILITY.GLOBAL)) {
        setAssignGlobalAdminAction((draft) => {
          draft.open = true;
          draft.title = "Assign Global Admin Role";
          draft.message =
            "Are you sure you want to make the user a global admin? Doing so will give them full access to view and manage data for all clients.";
          draft.requiredUserInput = user.email;
          draft.onConfirm = () => {
            doSubmit();
          };
        });
      } else if (
        selectedRole.permissions.some((p) => p === VISIBILITY.SUPER_ADMIN)
      ) {
        setAssignGlobalAdminAction((draft) => {
          draft.open = true;
          draft.title = "Assign Super Admin Role";
          draft.message =
            "Are you sure you want to make the user a super admin? Doing so will give them full access to admin controls and the ability to view and manage data for all clients.";
          draft.requiredUserInput = user.email;
          draft.onConfirm = () => {
            doSubmit();
          };
        });
      }
    } else {
      doSubmit();
    }
  };

  return (
    <>
      <FormProvider {...form}>
        <form
          className="space-y-8"
          method="post"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <RoleCombobox
                    value={field.value}
                    defaultByName={user.roleName}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="w-full"
                    onRoleChange={setSelectedRole}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}>
            {isSubmitting
              ? "Processing..."
              : user.roleName
              ? "Reassign"
              : "Assign"}
          </Button>
        </form>
      </FormProvider>
      <ConfirmationDialog {...assignGlobalAdminAction} />
    </>
  );
}
