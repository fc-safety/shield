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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import type { z } from "zod";
import { ProductTypes, type Product } from "~/lib/models";
import {
  createProductSchemaResolver,
  updateProductSchemaResolver,
  type createProductSchema,
  type updateProductSchema,
} from "~/lib/schema";
import ManufacturerSelector from "./manufacturer-selector";
import ProductCategorySelector from "./product-category-selector";

type TForm = z.infer<typeof createProductSchema | typeof updateProductSchema>;
interface ProductDetailsFormProps {
  product?: Product;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  id: "",
  active: true,
  type: "PRIMARY",
  name: "",
  description: "",
  sku: "",
  productUrl: "",
} satisfies TForm;

export default function ProductDetailsForm({
  product,
  onSubmitted,
}: ProductDetailsFormProps) {
  const isNew = !product;

  const form = useRemixForm<TForm>({
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
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  return (
    <FormProvider {...form}>
      <Form
        className="space-y-4"
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
        <FormField
          control={form.control}
          name="type"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <RadioGroup
                  {...field}
                  onValueChange={onChange}
                  className="flex gap-4"
                >
                  {ProductTypes.map((type, idx) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={"status" + idx} />
                      <Label className="capitalize" htmlFor={"status" + idx}>
                        {type.toLowerCase()}
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
                <Input {...field} />
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
