import LegacyIdField from "@/components/ui-custom/forms/legacy-id-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";
import type { DataOrError, ViewContext } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { connectOrEmpty } from "~/lib/model-form-converters";
import { type ResultsPage, type Site } from "~/lib/models";
import { getSiteSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import { type QueryParams } from "~/lib/urls";
import { isSuperAdmin } from "~/lib/users";
import { beautifyPhone, stripPhone } from "~/lib/utils";
import { CopyableInput } from "../copyable-input";
import ActiveToggleField from "../ui-custom/forms/active-toggle-field";
import { Checkbox } from "../ui/checkbox";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import SiteCombobox from "./site-combobox";

export interface SiteDetailsFormProps {
  site?: Site;
  clientId?: string;
  parentSiteId?: string;
  onSubmitted?: () => void;
  isSiteGroup?: boolean;
  viewContext?: ViewContext;
}

export default function SiteDetailsForm({
  site,
  clientId,
  parentSiteId,
  onSubmitted,
  isSiteGroup = false,
  viewContext = "user",
}: SiteDetailsFormProps) {
  const { user } = useAuth();
  const userIsSuperAdmin = isSuperAdmin(user);

  const isNew = !site;
  const currentlyPopulatedZip = useRef<string | null>(null);
  const [zipPopulatePending, setZipPopulatePending] = useState(false);
  const [subsites, setSubsites] = useState<Site[] | undefined>();

  const siteSchema = getSiteSchema({ create: !site, isSiteGroup });
  type TForm = z.infer<typeof siteSchema>;

  const FORM_DEFAULTS = useMemo(
    () =>
      ({
        primary: false,
        active: true,
        name: "",
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
        phoneNumber: "",
        client: connectOrEmpty(clientId),
        parentSite: connectOrEmpty(parentSiteId),
      }) satisfies TForm,
    [clientId, parentSiteId]
  );

  const form = useForm({
    resolver: zodResolver(siteSchema),
    values: (site
      ? {
          ...site,
          address: {
            create: undefined,
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
          subsites:
            isSiteGroup && site.subsites
              ? {
                  set: site.subsites.map((s) => ({ id: s.id })),
                }
              : undefined,
        }
      : FORM_DEFAULTS) as TForm,
  });

  const {
    formState: { isDirty },
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
            setValue(site ? "address.update.city" : "address.create.city", r.city, {
              shouldValidate: true,
            });
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

  const {
    load: subsitesLoad,
    data: subsitesData,
    isLoading: subsitesLoading,
  } = useModalFetcher<DataOrError<ResultsPage<Site>>>();
  const handleSubsitesLoad = useCallback(() => {
    if (!subsitesLoading && !subsitesData) {
      const query: QueryParams = {
        limit: 10000,
        clientId,
        _throw: "false",
        _viewContext: viewContext,
      };
      if (site?.id) {
        query.OR = [
          {
            parentSiteId: site.id,
          },
          {
            parentSiteId: "_NULL",
          },
        ];
      } else {
        query.parentSiteId = "_NULL";
      }
      subsitesLoad({ path: "/api/proxy/sites", query });
    }
  }, [site, subsitesLoad, viewContext, clientId, subsitesLoading, subsitesData]);

  useEffect(() => {
    handleSubsitesLoad();
  }, [handleSubsitesLoad]);

  useEffect(() => {
    if (!subsitesData?.data) return;
    setSubsites(subsitesData.data.results.filter((s) => !s._count?.subsites));
  }, [subsitesData]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
      path: "/api/proxy/sites",
      id: site?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(handleSubmit, (e) => {
          console.error("form error", e);
        })}
      >
        <Input type="hidden" {...form.register("id")} hidden />
        <Input type="hidden" {...form.register("client.connect.id")} hidden />
        <ActiveToggleField />
        {!isSiteGroup && (
          <Controller
            control={form.control}
            name="primary"
            render={({ field: { onChange, value, onBlur }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="primarySite"
                    checked={value}
                    onCheckedChange={onChange}
                    onBlur={onBlur}
                  />
                  <Label
                    htmlFor="primarySite"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Primary site
                  </Label>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
        {userIsSuperAdmin && (
          <Controller
            control={form.control}
            name="externalId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="externalId">External ID</FieldLabel>
                {isNew ? (
                  <Input
                    id="externalId"
                    {...field}
                    placeholder="Automatically generated"
                    tabIndex={-1}
                    aria-invalid={fieldState.invalid}
                  />
                ) : (
                  <CopyableInput {...field} readOnly />
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
        {isSiteGroup ? (
          <LegacyIdField
            form={form}
            fieldName="legacyGroupId"
            label="Legacy Group ID"
            description="Group ID from the legacy Shield system"
          />
        ) : (
          <LegacyIdField
            form={form}
            fieldName="legacySiteId"
            label="Legacy Site ID"
            description="Site ID from the legacy Shield system"
          />
        )}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" {...field} aria-invalid={fieldState.invalid} />
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
              <FieldLabel htmlFor="street1">Address Line 1</FieldLabel>
              <Input id="street1" {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name={isNew ? "address.create.street2" : "address.update.street2"}
          render={({ field: { value, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="street2">Address Line 2</FieldLabel>
              <Input
                id="street2"
                {...field}
                value={value ?? ""}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name={isNew ? "address.create.zip" : "address.update.zip"}
          render={({ field: { value, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="zip">Zip</FieldLabel>
              <Input id="zip" {...field} value={value ?? ""} aria-invalid={fieldState.invalid} />
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
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  {...field}
                  value={value ?? ""}
                  disabled={zipPopulatePending}
                  tabIndex={-1}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name={isNew ? "address.create.state" : "address.update.state"}
            render={({ field: { value, ...field }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="state">State</FieldLabel>
                <Input
                  id="state"
                  {...field}
                  value={value ?? ""}
                  disabled={zipPopulatePending}
                  tabIndex={-1}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="phoneNumber"
          render={({ field: { value, onChange, ...field }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phoneNumber">Phone</FieldLabel>
              <Input
                id="phoneNumber"
                {...field}
                value={beautifyPhone(value ?? "")}
                onChange={(e) => onChange(stripPhone(beautifyPhone(e.target.value)))}
                type="phone"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {isSiteGroup ? (
          <Controller
            control={form.control}
            name={isNew ? "subsites.connect" : "subsites.set"}
            render={({ field: { value, onChange }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Subsites</FieldLabel>
                <div className="space-y-4">
                  {subsitesLoading &&
                    Array.from({ length: site?.subsites?.length ?? 1 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  {subsites && subsites.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No available subsites found. If you are looking to add a site that belongs to
                      another group, remove the site from that group first.
                    </p>
                  )}
                  {subsites?.map((subsite) => (
                    <div key={subsite.id} className="flex flex-row items-center space-y-0 space-x-1">
                      <Checkbox
                        id={`subsite-${subsite.id}`}
                        checked={!!value?.find((v) => v.id === subsite.id)}
                        onCheckedChange={(checked) =>
                          onChange(
                            checked
                              ? [...(value ?? []), { id: subsite.id }]
                              : value
                                ? value.filter((v) => v.id !== subsite.id)
                                : []
                          )
                        }
                      />
                      <Label
                        htmlFor={`subsite-${subsite.id}`}
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {subsite.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        ) : (
          <Controller
            control={form.control}
            name="parentSite.connect.id"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="siteGroup">Site Group</FieldLabel>
                <SiteCombobox
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  clientId={clientId}
                  viewContext={viewContext}
                  includeSiteGroups="exclusively"
                  showClear={false}
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
