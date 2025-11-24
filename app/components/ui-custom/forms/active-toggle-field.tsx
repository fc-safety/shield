import { useId, type ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { cn } from "~/lib/utils";
import HelpPopover from "../../help-popover";
import { Field, FieldContent, FieldError, FieldLabel } from "../../ui/field";
import { Switch } from "../../ui/switch";

type TForm = { active: boolean };

export default function ActiveToggleField({
  helpPopoverContent,
}: {
  helpPopoverContent?: ReactNode;
}) {
  const form = useFormContext<TForm>();
  const id = useId();
  const fieldId = `active-toggle-${id}`;

  return (
    <Controller
      control={form.control}
      name="active"
      render={({ field: { onChange, onBlur, value }, fieldState }) => (
        <Field data-invalid={fieldState.invalid} orientation="horizontal">
          <Switch id={fieldId} checked={value} onCheckedChange={onChange} onBlur={onBlur} />
          <FieldContent>
            <FieldLabel htmlFor={fieldId} className={cn(!value && "text-muted-foreground")}>
              {value ? "Active" : "Inactive"}
              {helpPopoverContent && <HelpPopover>{helpPopoverContent}</HelpPopover>}
            </FieldLabel>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldContent>
        </Field>
      )}
    />
  );
}
