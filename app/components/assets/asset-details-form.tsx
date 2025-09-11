import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ChevronDown, Eraser, Plus } from "lucide-react";
import { Fragment, useState } from "react";
import { useForm, useFormContext, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { ViewContext } from "~/.server/api-utils";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Asset } from "~/lib/models";
import { createAssetSchema, updateAssetSchema } from "~/lib/schema";
import { hasMultiSiteVisibility, isGlobalAdmin } from "~/lib/users";
import { isEmpty } from "~/lib/utils";
import ActiveToggleFormInput from "../active-toggle-form-input";
import ClientCombobox from "../clients/client-combobox";
import SiteCombobox from "../clients/site-combobox";
import HelpPopover from "../help-popover";
import LegacyIdField from "../legacy-id-field";
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
  context?: ViewContext;
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
  context,
}: AssetDetailsFormProps) {
  const { user } = useAuth();

  const isNew = !asset;

  const form = useForm({
    resolver: zodResolver(asset ? updateAssetSchema : createAssetSchema),
    values: asset
      ? {
          ...asset,
          product: asset.productId
            ? {
                connect: {
                  id: asset.productId,
                },
              }
            : undefined,
          site: {
            connect: {
              id: asset.siteId,
            },
          },
          client: clientId
            ? {
                connect: {
                  id: clientId,
                },
              }
            : undefined,
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
    // Remove undefined values to make it JSON-serializable
    const cleanedData = JSON.parse(JSON.stringify(data));
    submit(cleanedData, {
      path: "/api/proxy/assets",
      id: asset?.id,
      viewContext: context,
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
          showClientSelect={isGlobalAdmin(user) && context === "admin" && !clientId}
          showSiteSelect={hasMultiSiteVisibility(user) && !siteId}
          clientId={formClientId}
          showProductSelect
          productReadOnly={!!asset?.setupOn}
          viewContext={context}
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
  viewContext = "user",
  productReadOnly = false,
}: {
  form: UseFormReturn<TForm>;
  showActiveToggle?: boolean;
  showClientSelect?: boolean;
  showSiteSelect?: boolean;
  showProductSelect?: boolean;
  clientId?: string;
  viewContext?: ViewContext;
  productReadOnly?: boolean;
}) {
  const { user } = useAuth();
  const userIsGlobalAdmin = isGlobalAdmin(user);
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
              Friendly Name (Optional){" "}
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
                  viewContext={viewContext}
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
                  disabled={isGlobalAdmin(user) && viewContext === "admin" && !clientId}
                  viewContext={viewContext}
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
            {userIsGlobalAdmin && <AssetMetadataInput />}
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

type TMetadataForm = Pick<z.infer<typeof createAssetSchema>, "metadata">;
function AssetMetadataInput() {
  const form = useFormContext<TMetadataForm>();

  return (
    <FormField
      control={form.control}
      name="metadata"
      render={({ field }) => {
        const metadataArray = Object.entries(field.value ?? { "": "" });

        const updateKey = (idx: number, key: string) => {
          const newMetadata = [...metadataArray];
          newMetadata[idx][0] = key;
          field.onChange(arrayToObject(newMetadata));
        };

        const updateValue = (idx: number, value: string) => {
          const newMetadata = [...metadataArray];
          newMetadata[idx][1] = value;
          field.onChange(arrayToObject(newMetadata));
        };

        const deleteMetadata = (idx: number) => {
          const newMetadata = [...metadataArray];
          newMetadata.splice(idx, 1);
          field.onChange(arrayToObject(newMetadata));
        };

        return (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Metadata
              <HelpPopover>
                Metadata can be used to store additional information about the asset.
              </HelpPopover>
              <Button
                variant="outline"
                size="iconSm"
                type="button"
                className="size-5"
                onClick={() => {
                  field.onChange({
                    ...(field.value ?? {}),
                    [""]: "",
                  });
                }}
              >
                <Plus />
              </Button>
            </FormLabel>
            <FormControl>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                {metadataArray.length > 0 && (
                  <>
                    <span className="text-xs font-medium">Key</span>
                    <span className="text-xs font-medium">Value</span>
                    <span></span>
                  </>
                )}

                {metadataArray.map(([key, value], idx) => (
                  <Fragment key={idx}>
                    <Input
                      autoFocus={false}
                      value={key}
                      onChange={(e) => updateKey(idx, e.target.value)}
                    />
                    <Input
                      autoFocus={false}
                      value={value}
                      onChange={(e) => updateValue(idx, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="iconSm"
                      type="button"
                      onClick={() => deleteMetadata(idx)}
                    >
                      <Eraser className="size-4" />
                    </Button>
                  </Fragment>
                ))}

                {metadataArray.length === 0 && (
                  <p className="text-muted-foreground col-span-full text-xs italic">No metadata.</p>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

const arrayToObject = (array: [string, string][]) => {
  return array.reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );
};
