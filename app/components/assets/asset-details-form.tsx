import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { useAccessIntent } from "~/contexts/requested-access-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { connectOrEmpty } from "~/lib/model-form-converters";
import type { Asset } from "~/lib/models";
import { createAssetSchema, updateAssetSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import { hasMultiSiteVisibility, isGlobalAdmin } from "~/lib/users";
import { isEmpty, nullValuesToUndefined } from "~/lib/utils";
import ActiveToggleFormInput from "../active-toggle-form-input";
import ClientCombobox from "../clients/client-combobox";
import SiteCombobox from "../clients/site-combobox";
import HelpPopover from "../help-popover";
import LegacyIdField from "../legacy-id-field";
import MetadataInput from "../metadata-input";
import ProductSelector from "../products/product-selector";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as FormProvider,
} from "../ui/form";
import { Input } from "../ui/input";

type TForm = z.infer<typeof updateAssetSchema | typeof createAssetSchema>;
interface AssetDetailsFormProps {
  asset?: Asset;
  onSubmitted?: () => void;
  clientId?: string;
  siteId?: string;
  nestDrawers?: boolean;
}

const FORM_DEFAULTS = {
  active: true,
  serialNumber: "",
  name: "",
  location: "",
  placement: "",
} satisfies TForm;

export default function AssetDetailsForm({
  asset,
  onSubmitted,
  clientId,
  siteId,
  nestDrawers,
}: AssetDetailsFormProps) {
  const { user } = useAuth();
  const accessIntent = useAccessIntent();

  const isNew = !asset;

  const form = useForm({
    resolver: zodResolver(asset ? updateAssetSchema : createAssetSchema),
    values: asset
      ? {
          ...nullValuesToUndefined(asset),
          product: connectOrEmpty(asset, "productId"),
          site: connectOrEmpty(asset, "siteId"),
          client: connectOrEmpty(asset, "clientId"),
        }
      : {
          ...FORM_DEFAULTS,
          client: clientId
            ? {
                connect: {
                  id: clientId,
                },
              }
            : undefined,
          site: siteId
            ? {
                connect: {
                  id: siteId,
                },
              }
            : undefined,
        },
    mode: "onChange",
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const formClientId = watch("client.connect.id");

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
      path: "/api/proxy/assets",
      id: asset?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(handleSubmit)(e);
        }}
      >
        <AssetDetailFormFields
          form={form}
          showClientSelect={isGlobalAdmin(user) && accessIntent === "system" && !clientId}
          showSiteSelect={hasMultiSiteVisibility(user) && !siteId}
          clientId={formClientId}
          showProductSelect
          productReadOnly={accessIntent !== "system" && !!asset?.setupOn}
          nestDrawers={nestDrawers}
        />
        <Button
          className="w-full"
          type="submit"
          disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}

export function AssetDetailFormFields({
  form,
  showActiveToggle = true,
  showClientSelect = false,
  showSiteSelect = false,
  showProductSelect = false,
  clientId,
  productReadOnly = false,
  nestDrawers = false,
}: {
  form: UseFormReturn<TForm>;
  showActiveToggle?: boolean;
  showClientSelect?: boolean;
  showSiteSelect?: boolean;
  showProductSelect?: boolean;
  clientId?: string;
  productReadOnly?: boolean;
  nestDrawers?: boolean;
}) {
  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);
  const accessIntent = useAccessIntent();

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <>
      <Input type="hidden" {...form.register("id")} hidden />
      {showActiveToggle && <ActiveToggleFormInput />}
      {showProductSelect && (
        <FormField
          control={form.control}
          name="product"
          render={({ field: { onChange, value, disabled } }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <FormControl>
                <ProductSelector
                  value={value?.connect.id ?? ""}
                  onValueChange={(id) => onChange(id ? { connect: { id } } : undefined)}
                  disabled={disabled}
                  readOnly={productReadOnly}
                  className="flex"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={form.control}
        name="serialNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="inline-flex items-center gap-1">
              Serial Number{" "}
              <HelpPopover>The serial number is used to uniquely identify the asset.</HelpPopover>
            </FormLabel>
            <FormControl>
              <Input {...field} />
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
            <FormLabel className="inline-flex items-center gap-1">
              Nickname (Optional){" "}
              <HelpPopover>Optional name for easier identification.</HelpPopover>
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {showClientSelect && (
        <FormField
          control={form.control}
          name="client.connect.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <FormControl>
                <ClientCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  className="w-full"
                  showClear={false}
                  nestDrawers={nestDrawers}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {showSiteSelect && (
        <FormField
          control={form.control}
          name="site.connect.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <FormControl>
                <SiteCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  className="w-full"
                  showClear={false}
                  clientId={clientId}
                  disabled={isGlobalAdmin(user) && accessIntent === "system" && !clientId}
                  nestDrawers={nestDrawers}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="inline-flex items-center gap-1">
              Room / Area
              <HelpPopover>
                This is the room or general space where the asset is or will be located.
              </HelpPopover>
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="placement"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="inline-flex items-center gap-1">
              Placement
              <HelpPopover>
                Useful for helping to locate the asset, this is the specific placement of the asset
                within the room or area.
              </HelpPopover>
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Advanced Section */}
      <div className="rounded-lg border p-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="hover:text-muted-foreground flex w-full items-center justify-between text-sm font-medium transition-colors"
        >
          <span>Advanced Options</span>
          <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="size-4" />
          </motion.div>
        </button>

        <motion.div
          initial={false}
          animate={{
            height: showAdvanced ? "auto" : 0,
            opacity: showAdvanced ? 1 : 0,
          }}
          transition={{
            height: {
              duration: 0.3,
              ease: "easeInOut",
            },
            opacity: {
              duration: 0.2,
              ease: "easeInOut",
            },
          }}
          style={{ overflow: "hidden" }}
        >
          <div className="space-y-4 pt-6">
            {userIsGlobalAdmin && <MetadataInput />}
            <FormField
              control={form.control}
              name="inspectionCycle"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1">
                    Inspection Cycle{" "}
                    <HelpPopover>
                      The required maximum number of days between inspections for this asset.
                    </HelpPopover>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input {...field} value={isEmpty(value) ? "" : value} type="number" min={1} />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={isEmpty(value)}
                        onClick={() =>
                          form.setValue("inspectionCycle", null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        Reset to client default
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    The number of days between inspections for this asset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LegacyIdField
              form={form}
              fieldName="legacyAssetId"
              label="Legacy Asset ID"
              description="Asset ID from the legacy Shield system"
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}
