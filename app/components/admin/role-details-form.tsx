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
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createRoleSchema, updateRoleSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import type { Role } from "~/lib/types";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
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

export default function RoleDetailsForm({ role, onSubmitted }: RoleDetailsFormProps) {
  const isNew = !role;

  const form = useForm<TForm>({
    resolver: zodResolver(isNew ? createRoleSchema : updateRoleSchema),
    defaultValues: role ?? FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
      path: `/api/proxy/roles`,
      id: role?.id,
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientAssignable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignable by clients</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} className="block" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
