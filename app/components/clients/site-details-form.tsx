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
import { useEffect, useMemo, useRef, useState } from "react";
import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";
import { type Site } from "~/lib/models";
import {
  createSiteSchema,
  createSiteSchemaResolver,
  updateSiteSchema,
  updateSiteSchemaResolver,
} from "~/lib/schema";
import { beautifyPhone, stripPhone } from "~/lib/utils";
import { CopyableInput } from "../copyable-input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

type TForm = z.infer<typeof createSiteSchema | typeof updateSiteSchema>;
interface SiteDetailsFormProps {
  site?: Site;
  clientId: string;
  onSubmitted?: () => void;
}

export default function SiteDetailsForm({
  site,
  clientId,
  onSubmitted,
}: SiteDetailsFormProps) {
  const isNew = !site;
  const currentlyPopulatedZip = useRef<string | null>(null);
  const [zipPopulatePending, setZipPopulatePending] = useState(false);

  const FORM_DEFAULTS = useMemo(
    () =>
      ({
        primary: false,
        name: "",
        address: {
          create: {
            street1: "",
            city: "",
            state: "",
            zip: "",
          },
        },
        phoneNumber: "",
        client: {
          connect: {
            id: clientId,
          },
        },
      } satisfies z.infer<typeof createSiteSchema>),
    [clientId]
  );

  const form = useRemixForm<TForm>({
    resolver: site ? updateSiteSchemaResolver : createSiteSchemaResolver,
    defaultValues: FORM_DEFAULTS,
    values: site && {
      ...site,
      address: {
        update: {
          ...site.address,
          street2: site.address.street2 || undefined,
        },
      },
      client: {
        connect: {
          id: site.clientId,
        },
      },
      parentSite: site.parentSiteId
        ? {
            connect: {
              id: site.parentSiteId,
            },
          }
        : undefined,
    },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid, isSubmitting },
    watch,
    setValue,
  } = form;

  const zip = watch(site ? "address.update.zip" : "address.create.zip");
  const [debouncedZip] = useDebounceValue(zip, 350);
  useEffect(() => {
    if (
      z.string().length(5).safeParse(debouncedZip).success &&
      (!site || debouncedZip !== site.address.zip) &&
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
              site ? "address.update.city" : "address.create.city",
              r.city,
              {
                shouldValidate: true,
              }
            );
            setValue(
              site ? "address.update.state" : "address.create.state",
              r.state_code ?? r.state_en,
              {
                shouldValidate: true,
              }
            );
          }
          setZipPopulatePending(false);
        });
    }
  }, [debouncedZip, site, setValue]);

  return (
    <FormProvider {...form}>
      <Form
        className="space-y-4"
        method="post"
        action="?resource=site"
        onSubmit={(e) => {
          form.handleSubmit(e).then(() => {
            onSubmitted?.();
          });
        }}
      >
        <Input type="hidden" {...form.register("id")} hidden />
        <Input type="hidden" {...form.register("client.connect.id")} hidden />
        <FormField
          control={form.control}
          name="primary"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="primarySite"
                    checked={field.value}
                    onCheckedChange={onChange}
                  />
                  <Label
                    htmlFor="primarySite"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Primary site
                  </Label>
                </div>
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
                  <Input
                    {...field}
                    placeholder="Automatically generated"
                    tabIndex={-1}
                  />
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
                <Input {...field} />
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
                  <Input
                    {...field}
                    disabled={zipPopulatePending}
                    tabIndex={-1}
                  />
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
                  <Input
                    {...field}
                    disabled={zipPopulatePending}
                    tabIndex={-1}
                  />
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
