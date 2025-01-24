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
import { useModalSubmit } from "~/hooks/use-modal-submit";
import {
  createRoleSchemaResolver,
  updateRoleSchemaResolver,
  type createRoleSchema,
  type updateRoleSchema,
} from "~/lib/schema";
import type { Role } from "~/lib/types";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type TForm = z.infer<typeof createRoleSchema | typeof updateRoleSchema>;
interface RoleDetailsFormProps {
  role?: Role;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  name: "",
  description: "",
} satisfies TForm;

export default function RoleDetailsForm({
  role,
  onSubmitted,
}: RoleDetailsFormProps) {
  const isNew = !role;

  const form = useForm<TForm>({
    resolver: isNew ? createRoleSchemaResolver : updateRoleSchemaResolver,
    defaultValues: role ?? FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/roles`,
      id: role?.id,
      query: {
        _throw: "false",
      },
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
