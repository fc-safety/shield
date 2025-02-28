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
  createUserSchemaResolver,
  updateUserSchemaResolver,
  type createUserSchema,
  type updateUserSchema,
} from "~/lib/schema";
import type { ClientUser } from "~/lib/types";
import { beautifyPhone, stripPhone } from "~/lib/utils";
import { Input } from "../ui/input";
import SiteCombobox from "./site-combobox";

type TForm = z.infer<typeof createUserSchema | typeof updateUserSchema>;
interface ClientUserDetailsFormProps {
  user?: ClientUser;
  onSubmitted?: () => void;
  clientId: string;
  siteExternalId?: string;
}

const FORM_DEFAULTS = {
  firstName: "",
  lastName: "",
  email: "",
  siteExternalId: "",
} satisfies TForm;

export default function ClientUserDetailsForm({
  user,
  onSubmitted,
  clientId,
  siteExternalId,
}: ClientUserDetailsFormProps) {
  const isNew = !user;

  const form = useForm<TForm>({
    resolver: isNew ? createUserSchemaResolver : updateUserSchemaResolver,
    defaultValues: user ?? {
      ...FORM_DEFAULTS,
      siteExternalId: siteExternalId ?? "",
    },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/clients/${clientId}/users`,
      id: user?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={"phoneNumber"}
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={beautifyPhone(value ?? "")}
                  onChange={(e) =>
                    onChange(stripPhone(beautifyPhone(e.target.value)))
                  }
                  type="phone"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!siteExternalId && (
          <FormField
            control={form.control}
            name="siteExternalId"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Site</FormLabel>
                <FormControl>
                  <SiteCombobox
                    value={value}
                    onValueChange={onChange}
                    clientId={clientId}
                    className="w-full"
                    valueKey="externalId"
                    showClear={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
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
