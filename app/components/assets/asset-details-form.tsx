import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import type { Asset } from "~/lib/models";
import {
  createAssetSchema,
  createAssetSchemaResolver,
  updateAssetSchema,
  updateAssetSchemaResolver,
} from "~/lib/schema";
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
import TagSelector from "./tag-selector";

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
  const isNew = !asset;

  const form = useRemixForm<TForm>({
    resolver: asset ? updateAssetSchemaResolver : createAssetSchemaResolver,
    values: asset
      ? {
          ...asset,
          tag: asset.tagId
            ? {
                connect: {
                  id: asset.tagId,
                },
              }
            : undefined,
          product: asset.productId
            ? {
                connect: {
                  id: asset.productId,
                },
              }
            : undefined,
        }
      : FORM_DEFAULTS,
    mode: "onChange",
  });

  const {
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  return (
    <FormProvider {...form}>
      <Form
        className="space-y-4"
        method={"post"}
        onSubmit={(e) => {
          form.handleSubmit(e).then(() => {
            onSubmitted?.();
          });
        }}
      >
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
          name="tag.connect.id"
          render={({ field: { onChange, value, onBlur, disabled } }) => (
            <FormItem>
              <FormLabel>Tag</FormLabel>
              <FormControl>
                <TagSelector
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  disabled={disabled}
                  className="flex"
                />
              </FormControl>
              <FormDescription></FormDescription>
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
        <Button
          className="w-full"
          type="submit"
          disabled={isSubmitting || (!isNew && !isDirty) || !isValid}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Form>
    </FormProvider>
  );
}
