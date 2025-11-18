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
import type { ViewContext } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createUserSchema, updateUserSchema } from "~/lib/schema";
import type { ClientUser } from "~/lib/types";
import { beautifyPhone, stripPhone } from "~/lib/utils";
import LegacyIdField from "../legacy-id-field";
import { Input } from "../ui/input";
import SiteCombobox from "./site-combobox";

type TForm = z.infer<typeof createUserSchema | typeof updateUserSchema>;
interface ClientUserDetailsFormProps {
  user?: ClientUser;
  onSubmitted?: () => void;
  clientId?: string;
  siteExternalId?: string;
  viewContext?: ViewContext;
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
  viewContext,
}: ClientUserDetailsFormProps) {
  const isNew = !user;

  const form = useForm({
    resolver: zodResolver(isNew ? createUserSchema : updateUserSchema),
    defaultValues: (user ?? {
      ...FORM_DEFAULTS,
      siteExternalId: siteExternalId ?? "",
    }) as TForm,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    // Remove undefined values to make it JSON-serializable
    const cleanedData = JSON.parse(JSON.stringify(data));
    submit(cleanedData, {
      path: "/api/proxy/users",
      id: user?.id,
      query: {
        clientId,
      },
      viewContext,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <LegacyIdField
          form={form}
          fieldName="legacyUserId"
          label="Legacy User ID"
          description="User ID from the legacy Shield system"
        />
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
                <Input {...field} type="email" inputMode="email" />
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
                  onChange={(e) => onChange(stripPhone(beautifyPhone(e.target.value)))}
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
                <FormLabel>Site or Site Group</FormLabel>
                <FormControl>
                  <SiteCombobox
                    value={value}
                    onValueChange={onChange}
                    clientId={clientId}
                    className="w-full"
                    valueKey="externalId"
                    showClear={false}
                    viewContext={viewContext}
                    includeSiteGroups
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
