import { Button } from "@/components/ui/button";
import { extractErrorMessage, Form as FormProvider } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useViewContext } from "~/contexts/requested-access-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { createUserSchema, updateUserSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import type { UserResponse } from "~/lib/types";
import { beautifyPhone, stripPhone } from "~/lib/utils";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import SiteCombobox from "./site-combobox";

type TForm = z.infer<typeof createUserSchema | typeof updateUserSchema>;
interface ClientUserDetailsFormProps {
  user?: UserResponse;
  onSubmitted?: () => void;
  clientId?: string;
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
  const viewContext = useViewContext();
  const isNew = !user;

  const form = useForm({
    resolver: zodResolver(isNew ? createUserSchema : updateUserSchema),
    defaultValues: (user ?? {
      ...FORM_DEFAULTS,
      siteExternalId: siteExternalId ?? "",
    }) as TForm,
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
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
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(handleSubmit, (e) => {
          toast.error("Please fix the errors in the form.", {
            description: extractErrorMessage(e),
            duration: 10000,
          });
        })}
      >
        <Controller
          control={form.control}
          name="firstName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>First Name</FieldLabel>
              <Input {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="lastName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Last Name</FieldLabel>
              <Input {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Email</FieldLabel>
              <Input {...field} type="email" inputMode="email" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name={"phoneNumber"}
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Phone</FieldLabel>
              <Input
                {...field}
                value={beautifyPhone(value ?? "")}
                onChange={(e) => onChange(stripPhone(beautifyPhone(e.target.value)))}
                type="phone"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="position"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Position</FieldLabel>
              <Input {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {!siteExternalId && (
          <Controller
            control={form.control}
            name="siteExternalId"
            render={({ field: { value, onChange }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Site or Site Group</FieldLabel>
                <SiteCombobox
                  value={value}
                  onValueChange={onChange}
                  clientId={clientId}
                  className="w-full"
                  valueKey="externalId"
                  showClear={false}
                  includeSiteGroups
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
