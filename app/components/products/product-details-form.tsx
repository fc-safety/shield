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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import { type Product } from "~/lib/models";
import {
  createProductSchema,
  createProductSchemaResolver,
  updateProductSchemaResolver,
  type updateProductSchema,
} from "~/lib/schema";
import ClientCombobox from "../clients/client-combobox";
import ManufacturerSelector from "./manufacturer-selector";
import ProductCategorySelector from "./product-category-selector";

type TForm = z.infer<typeof createProductSchema | typeof updateProductSchema>;
interface ProductDetailsFormProps {
  product?: Product;
  onSubmitted?: () => void;
  canAssignOwnership?: boolean;
  parentProduct?: Product;
}

export default function ProductDetailsForm({
  product,
  onSubmitted,
  canAssignOwnership = false,
  parentProduct,
}: ProductDetailsFormProps) {
  const isNew = !product;

  const FORM_DEFAULTS = {
    id: "",
    active: true,
    type: parentProduct ? "CONSUMABLE" : "PRIMARY",
    productCategory: {
      connect: {
        id: parentProduct?.productCategoryId ?? "",
      },
    },
    manufacturer: {
      connect: {
        id: parentProduct?.manufacturerId ?? "",
      },
    },
    name: "",
    description: "",
    sku: "",
    productUrl: "",
    parentProduct: parentProduct
      ? {
          connect: {
            id: parentProduct.id,
          },
        }
      : undefined,
  } satisfies TForm;

  const form = useForm<TForm>({
    resolver: isNew ? createProductSchemaResolver : updateProductSchemaResolver,
    values: product
      ? {
          ...product,
          productCategory: {
            connect: {
              id: product.productCategoryId,
            },
          },
          manufacturer: {
            connect: {
              id: product.manufacturerId,
            },
          },
          description: product.description ?? "",
          sku: product.sku ?? "",
          productUrl: product.productUrl ?? "",
          imageUrl: product.imageUrl ?? "",
          client: product.client
            ? { connect: { id: product.client.id } }
            : undefined,
          parentProduct: parentProduct
            ? { connect: { id: parentProduct.id } }
            : undefined,
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/products",
      id: product?.id,
      query: {
        _throw: "false",
      },
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
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={value}
                  onCheckedChange={onChange}
                  className="pt-0"
                  onBlur={onBlur}
                />
              </FormControl>
              <FormLabel>Active</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        {!parentProduct && (
          <>
            <FormField
              control={form.control}
              name="productCategory"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <ProductCategorySelector
                      value={value?.connect.id}
                      onValueChange={(id) => onChange({ connect: { id } })}
                      onBlur={onBlur}
                      className="flex"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <ManufacturerSelector
                      value={value?.connect.id}
                      onValueChange={(id) => onChange({ connect: { id } })}
                      onBlur={onBlur}
                      className="flex"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input {...field} type="file" accept="image/*" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {canAssignOwnership && (
          <FormField
            control={form.control}
            name="client.connect.id"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <FormControl>
                  <ClientCombobox
                    value={value}
                    onValueChange={onChange}
                    className="w-full"
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
