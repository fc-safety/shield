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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ViewContext } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { ProductCategory } from "~/lib/models";
import { createProductCategorySchema, updateProductCategorySchema } from "~/lib/schema";
import ActiveToggleFormInput from "../active-toggle-form-input";
import IconSelector from "../icons/icon-selector";
import LegacyIdField from "../legacy-id-field";

type TForm = z.infer<typeof createProductCategorySchema | typeof updateProductCategorySchema>;
interface ProductCategoryDetailsFormProps {
  productCategory?: ProductCategory;
  onSubmitted?: () => void;
  viewContext?: ViewContext;
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
  viewContext,
}: ProductCategoryDetailsFormProps) {
  const isNew = !productCategory;

  const form = useForm<TForm>({
    resolver: zodResolver(isNew ? createProductCategorySchema : updateProductCategorySchema),
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
    // Remove undefined values to make it JSON-serializable
    const cleanedData = JSON.parse(JSON.stringify(data));
    submit(cleanedData, {
      path: "/api/proxy/product-categories",
      id: productCategory?.id,
      viewContext,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="space-y-4" method="post" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <ActiveToggleFormInput />
        <LegacyIdField
          form={form}
          fieldName="legacyCategoryId"
          label="Legacy Category ID"
          description="Category ID from the legacy Shield system"
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
        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
