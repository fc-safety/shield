import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ViewContext } from "~/.server/api-utils";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Asset } from "~/lib/models";
import { createAssetSchema, updateAssetSchema } from "~/lib/schema";
import { hasMultiSiteVisibility, isGlobalAdmin } from "~/lib/users";
import { isEmpty } from "~/lib/utils";
import ClientCombobox from "../clients/client-combobox";
import SiteCombobox from "../clients/site-combobox";
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

  const form = useForm<TForm>({
    resolver: zodResolver(
      (asset ? updateAssetSchema : createAssetSchema) as z.Schema<TForm>
    ),
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
    submit(data, {
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
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="active"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <div className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={value}
                    onCheckedChange={onChange}
                    className="pt-0"
                    onBlur={onBlur}
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product"
          render={({ field: { onChange, value, disabled } }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <FormControl>
                <ProductSelector
                  value={value?.connect.id ?? ""}
                  onValueChange={(id) =>
                    onChange(id ? { connect: { id } } : undefined)
                  }
                  disabled={disabled}
                  readOnly={!!asset?.setupOn}
                  className="flex"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isGlobalAdmin(user) && context === "admin" && !clientId && (
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
                    viewContext={context}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {hasMultiSiteVisibility(user) && !siteId && (
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
                    clientId={formClientId}
                    disabled={
                      isGlobalAdmin(user) &&
                      context === "admin" &&
                      !formClientId
                    }
                    viewContext={context}
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
              <FormLabel>Location</FormLabel>
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
              <FormLabel>Placement</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inspectionCycle"
          render={({ field: { value, ...field } }) => (
            <FormItem>
              <FormLabel>Inspection Cycle</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    {...field}
                    value={isEmpty(value) ? "" : value}
                    type="number"
                    min={1}
                  />
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
