import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { useAuth } from "~/contexts/auth-context";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { Asset } from "~/lib/models";
import {
  createAssetSchema,
  createAssetSchemaResolver,
  updateAssetSchema,
  updateAssetSchemaResolver,
} from "~/lib/schema";
import { hasMultiSiteVisibility } from "~/lib/users";
import { isEmpty } from "~/lib/utils";
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
}: AssetDetailsFormProps) {
  const { user } = useAuth();

  const isNew = !asset;

  const form = useForm<TForm>({
    resolver: asset ? updateAssetSchemaResolver : createAssetSchemaResolver,
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
          client: undefined,
        }
      : FORM_DEFAULTS,
    mode: "onChange",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  useEffect(() => {
    console.debug({
      isDirty,
      isValid,
    });
  }, [isDirty, isValid]);

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/assets",
      id: asset?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="active"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <div className="flex items-center gap-2 space-y-0">
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
        {hasMultiSiteVisibility(user) && (
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
