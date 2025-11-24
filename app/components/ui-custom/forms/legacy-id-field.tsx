import { FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useId } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { useAuth } from "~/contexts/auth-context";
import { isSuperAdmin } from "~/lib/users";

interface LegacyIdFieldProps {
  form: UseFormReturn<any>;
  fieldName: string;
  label: string;
  description: string;
  readOnly?: boolean;
}

export default function LegacyIdField({
  form,
  fieldName,
  label,
  description,
  readOnly = false,
}: LegacyIdFieldProps) {
  const { user } = useAuth();
  const userIsSuperAdmin = isSuperAdmin(user);

  const id = useId();
  const fieldId = `legacy-id-${id}`;

  if (!userIsSuperAdmin) {
    return null;
  }

  return (
    <Controller
      control={form.control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId} className="text-muted-foreground">
            {label}
          </FieldLabel>
          <Input id={fieldId} {...field} readOnly={readOnly} />
          <FormDescription>{description}</FormDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
