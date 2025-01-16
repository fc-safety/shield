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
import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import type { z } from "zod";
import type { ProductCategory } from "~/lib/models";
import {
  createProductCategorySchemaResolver,
  updateProductCategorySchemaResolver,
  type createProductCategorySchema,
  type updateProductCategorySchema,
} from "~/lib/schema";
import IconSelector from "../icons/icon-selector";

type TForm = z.infer<
  typeof createProductCategorySchema | typeof updateProductCategorySchema
>;
interface ProductCategoryDetailsFormProps {
  productCategory?: ProductCategory;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  id: "",
  active: true,
  name: "",
  shortName: "",
  description: "",
  icon: "",
  color: "",
} satisfies TForm;

export default function ProductCategoryDetailsForm({
  productCategory,
  onSubmitted,
}: ProductCategoryDetailsFormProps) {
  const isNew = !productCategory;

  const form = useRemixForm<TForm>({
    resolver: isNew
      ? createProductCategorySchemaResolver
      : updateProductCategorySchemaResolver,
    values: productCategory
      ? {
          ...productCategory,
          shortName: productCategory.shortName ?? "",
          description: productCategory.description ?? "",
          icon: productCategory.icon ?? "",
          color: productCategory.color ?? "",
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid, isSubmitting },
    watch,
  } = form;

  const color = watch("color");

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
          name="shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
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
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input {...field} type="color" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <IconSelector
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  color={color}
                  className="flex"
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
