import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isAfter } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";
import { ClientStatuses, type Client } from "~/lib/models";
import {
  createClientSchemaResolver,
  updateClientSchema,
  updateClientSchemaResolver,
  type createClientSchema,
} from "~/lib/schema";
import { beautifyPhone, stripPhone } from "~/lib/utils";
import { CopyableInput } from "../copyable-input";
import { DatePicker } from "../date-picker";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

type TForm = z.infer<typeof createClientSchema | typeof updateClientSchema>;
interface ClientDetailsFormProps {
  client?: Client;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  name: "",
  startedOn: new Date(),
  address: {
    create: {
      street1: "",
      city: "",
      state: "",
      zip: "",
    },
  },
  status: "PENDING",
  phoneNumber: "",
} satisfies z.infer<typeof createClientSchema>;

export default function ClientDetailsForm({
  client,
  onSubmitted,
}: ClientDetailsFormProps) {
  const isNew = !client;
  const currentlyPopulatedZip = useRef<string | null>(null);
  const [zipPopulatePending, setZipPopulatePending] = useState(false);

  const form = useRemixForm<TForm>({
    resolver: client ? updateClientSchemaResolver : createClientSchemaResolver,
    defaultValues: FORM_DEFAULTS,
    values: client && {
      ...client,
      address: {
        update: {
          ...client.address,
          street2: client.address.street2 || undefined,
        },
      },
    },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid, isSubmitting },
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
            setValue(
              client ? "address.update.city" : "address.create.city",
              r.city
            );
            setValue(
              client ? "address.update.state" : "address.create.state",
              r.state_code ?? r.state_en
            );
          }
          setZipPopulatePending(false);
        });
    }
  }, [debouncedZip, client, setValue]);

  return (
    <FormProvider {...form}>
      <Form
        className="space-y-6"
        method="post"
        onSubmit={(e) => {
          form.handleSubmit(e).then(() => {
            onSubmitted?.();
          });
        }}
      >
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="status"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  {...field}
                  onValueChange={onChange}
                  className="flex gap-4"
                >
                  {ClientStatuses.map((status, idx) => (
                    <div key={status} className="flex items-center space-x-2">
                      <RadioGroupItem value={status} id={"status" + idx} />
                      <Label className="capitalize" htmlFor={"status" + idx}>
                        {status.toLowerCase()}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="externalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External ID</FormLabel>
              <FormControl>
                {isNew ? (
                  <Input {...field} placeholder="Automatically generated" />
                ) : (
                  <CopyableInput {...field} readOnly />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <Input {...field} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startedOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {!field.value || isAfter(field.value, new Date())
                  ? "Starts On"
                  : "Started On"}
              </FormLabel>
              <FormControl>
                <DatePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isNew && (
          <Input type="hidden" {...form.register("address.update.id")} hidden />
        )}
        <FormField
          control={form.control}
          name={isNew ? "address.create.street1" : "address.update.street1"}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={isNew ? "address.create.street2" : "address.update.street2"}
          render={({ field: { value, ...field } }) => (
            <FormItem>
              <FormLabel>Address Line 2</FormLabel>
              <FormControl>
                <Input {...field} value={value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={isNew ? "address.create.zip" : "address.update.zip"}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zip</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={isNew ? "address.create.city" : "address.update.city"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} disabled={zipPopulatePending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={isNew ? "address.create.state" : "address.update.state"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} disabled={zipPopulatePending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
        <Button
          type="submit"
          disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Form>
    </FormProvider>
  );
}
