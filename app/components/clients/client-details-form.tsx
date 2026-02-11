import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAfter, startOfDay } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";
import { CopyableInput } from "~/components/copyable-input";
import LegacyIdField from "~/components/ui-custom/forms/legacy-id-field";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { extractErrorMessage } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Switch } from "~/components/ui/switch";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { ClientStatuses, type Client } from "~/lib/models";
import { createClientSchema, updateClientSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import { isGlobalAdmin } from "~/lib/users";
import { beautifyPhone, stripPhone } from "~/lib/utils";

type TForm = z.infer<typeof createClientSchema | typeof updateClientSchema>;
interface ClientDetailsFormProps {
  client?: Client;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  id: "",
  name: "",
  startedOn: new Date().toISOString(),
  address: {
    create: {
      street1: "",
      street2: undefined,
      city: "",
      state: "",
      zip: "",
      county: null,
      country: null,
    },
    update: {},
  },
  status: "PENDING",
  phoneNumber: "",
  defaultInspectionCycle: 30,
} satisfies TForm;

export default function ClientDetailsForm({ client, onSubmitted }: ClientDetailsFormProps) {
  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);

  const isNew = !client;
  const currentlyPopulatedZip = useRef<string | null>(null);
  const [zipPopulatePending, setZipPopulatePending] = useState(false);

  const form = useForm({
    resolver: zodResolver(client ? updateClientSchema : createClientSchema),
    values: (client
      ? {
          ...client,
          address: {
            update: {
              ...client.address,
              street2: client.address.street2 || undefined,
            },
          },
        }
      : FORM_DEFAULTS) as TForm,
  });

  const {
    formState: { isDirty, isValid },
    watch,
    setValue,
  } = form;

  const zip = watch(client ? "address.update.zip" : "address.create.zip");
  const [debouncedZip] = useDebounceValue(zip, 350);
  useEffect(() => {
    if (
      z.string().length(5).safeParse(debouncedZip).success &&
      (!client || debouncedZip !== client.address.zip) &&
      debouncedZip !== currentlyPopulatedZip.current
    ) {
      setZipPopulatePending(true);
      console.debug("Fetching zip", debouncedZip);
      fetch(`/api/query-zip/${debouncedZip}`)
        .then((r) => r.json())
        .catch((e) => {
          console.error("Failed to fetch zip", e);
          return null;
        })
        .then((r) => {
          if (r) {
            setValue(client ? "address.update.city" : "address.create.city", r.city, {
              shouldValidate: true,
            });
            setValue(
              client ? "address.update.state" : "address.create.state",
              r.state_code ?? r.state_en,
              {
                shouldValidate: true,
              }
            );
          }
          setZipPopulatePending(false);
        });
    }
  }, [debouncedZip, client, setValue]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
      path: "/api/proxy/clients",
      id: client?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="space-y-4"
        method="post"
        onSubmit={form.handleSubmit(handleSubmit, (e) => {
          toast.error("Please fix the errors in the form.", {
            description: extractErrorMessage(e),
            duration: 10000,
          });
        })}
      >
        <Input type="hidden" {...form.register("id")} hidden />
        <Controller
          control={form.control}
          name="status"
          render={({ field: { onChange, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Status</FieldLabel>
              <RadioGroup {...field} onValueChange={onChange} className="flex gap-4">
                {ClientStatuses.map((status, idx) => (
                  <div key={status} className="flex items-center space-x-2">
                    <RadioGroupItem value={status} id={"status" + idx} />
                    <Label className="capitalize" htmlFor={"status" + idx}>
                      {status.toLowerCase()}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {userIsGlobalAdmin && (
          <Controller
            control={form.control}
            name="externalId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>External ID</FieldLabel>
                {isNew ? (
                  <Input {...field} placeholder="Automatically generated" tabIndex={-1} />
                ) : (
                  <CopyableInput {...field} readOnly />
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
        <LegacyIdField
          form={form}
          fieldName="legacyClientId"
          label="Legacy Client ID"
          description="Client ID from the legacy Shield system"
        />
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Name</FieldLabel>
              <Input {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="startedOn"
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                {!value || isAfter(value, startOfDay(new Date())) ? "Starting On" : "Started On"}
              </FieldLabel>
              <Input {...field} type="date" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {!isNew && <Input type="hidden" {...form.register("address.update.id")} hidden />}
        <Controller
          control={form.control}
          name={isNew ? "address.create.street1" : "address.update.street1"}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Address Line 1</FieldLabel>
              <Input {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name={isNew ? "address.create.street2" : "address.update.street2"}
          render={({ field: { value, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Address Line 2</FieldLabel>
              <Input {...field} value={value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name={isNew ? "address.create.zip" : "address.update.zip"}
          render={({ field: { value, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Zip</FieldLabel>
              <Input {...field} value={value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name={isNew ? "address.create.city" : "address.update.city"}
            render={({ field: { value, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>City</FieldLabel>
                <Input {...field} value={value ?? ""} disabled={zipPopulatePending} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name={isNew ? "address.create.state" : "address.update.state"}
            render={({ field: { value, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>State</FieldLabel>
                <Input {...field} value={value ?? ""} disabled={zipPopulatePending} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
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
          name={"defaultInspectionCycle"}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Default Inspection Cycle</FieldLabel>
              <Input {...field} type="number" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="demoMode"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Demo Mode</FieldLabel>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
