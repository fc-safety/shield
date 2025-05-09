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
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { z } from "zod";
import type { DataOrError, ViewContext } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { type ResultsPage, type Site } from "~/lib/models";
import { baseSiteSchema, getSiteSchema } from "~/lib/schema";
import { type QueryParams } from "~/lib/urls";
import { beautifyPhone, stripPhone } from "~/lib/utils";
import { CopyableInput } from "../copyable-input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import SiteCombobox from "./site-combobox";

type TForm = z.infer<typeof baseSiteSchema>;
export interface SiteDetailsFormProps {
  site?: Site;
  clientId: string;
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
  const isNew = !site;
  const currentlyPopulatedZip = useRef<string | null>(null);
  const [zipPopulatePending, setZipPopulatePending] = useState(false);
  const [subsites, setSubsites] = useState<Site[] | undefined>();

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
        parentSite: parentSiteId
          ? {
              connect: {
                id: parentSiteId,
              },
            }
          : undefined,
      } satisfies z.infer<typeof baseSiteSchema>),
    [clientId, parentSiteId]
  );

  const form = useForm<TForm>({
    resolver: zodResolver(
      getSiteSchema({ create: !site, isSiteGroup }) as z.Schema<TForm>
    ),
    values: site
      ? {
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
          subsites:
            isSiteGroup && site.subsites
              ? {
                  set: site.subsites.map((s) => ({ id: s.id })),
                }
              : undefined,
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
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
  }, [
    site,
    subsitesLoad,
    viewContext,
    clientId,
    subsitesLoading,
    subsitesData,
  ]);

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
    submit(data, {
      path: "/api/proxy/sites",
      id: site?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <Input type="hidden" {...form.register("client.connect.id")} hidden />
        {!isSiteGroup && (
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
        )}
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
        {isSiteGroup ? (
          <FormField
            control={form.control}
            name={isNew ? "subsites.connect" : "subsites.set"}
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Subsites</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {subsitesLoading &&
                      Array.from({ length: site?.subsites?.length ?? 1 }).map(
                        (_, i) => <Skeleton key={i} className="w-full h-6" />
                      )}
                    {subsites && subsites.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No available subsites found. If you are looking to add a
                        site that belongs to another group, remove the site from
                        that group first.
                      </p>
                    )}
                    {subsites?.map((subsite) => (
                      <FormItem
                        key={subsite.id}
                        className="flex flex-row items-center space-x-1 space-y-0"
                      >
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
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {subsite.name}
                        </Label>
                      </FormItem>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name={"parentSite.connect.id"}
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Site Group</FormLabel>
                <FormControl>
                  <SiteCombobox
                    value={value}
                    onValueChange={onChange}
                    clientId={clientId}
                    viewContext={viewContext}
                    includeSiteGroups="exclusively"
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
