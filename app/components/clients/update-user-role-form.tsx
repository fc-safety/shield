import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import {
  assignUserRoleSchemaResolver,
  type assignUserRoleSchema,
} from "~/lib/schema";
import type { ClientUser } from "~/lib/types";
import RoleCombobox from "./role-combobox";

type TForm = z.infer<typeof assignUserRoleSchema>;

interface UpdateUserRoleFormProps {
  user: ClientUser;
  clientId: string;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  roleId: "",
} satisfies TForm;

export default function UpdateUserRoleForm({
  user,
  clientId,
  onSubmitted,
}: UpdateUserRoleFormProps) {
  const form = useForm<TForm>({
    resolver: assignUserRoleSchemaResolver,
    defaultValues: FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      method: "POST",
      action: `/api/proxy/clients/${clientId}/users/${user.id}/assign-role?_throw=false`,
      encType: "application/json",
    });
  };
  return (
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}>
          {user.roleName ? "Resassign" : "Assign"}
        </Button>
      </form>
    </FormProvider>
  );
}
