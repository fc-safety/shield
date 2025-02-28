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
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
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

  const form = useForm<TForm>({
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
          client: productCategory.client
            ? { connect: { id: productCategory.client.id } }
            : undefined,
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const color = watch("color");

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/product-categories",
      id: productCategory?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="space-y-4"
        method="post"
        onSubmit={form.handleSubmit(handleSubmit)}
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
      </form>
    </FormProvider>
  );
}
