import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { AnsiCategory } from "~/lib/models";
import {
  createAnsiCategorySchema,
  updateAnsiCategorySchema,
} from "~/lib/schema";
import IconSelector from "../icons/icon-selector";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type TForm = z.infer<
  typeof createAnsiCategorySchema | typeof updateAnsiCategorySchema
>;

const createAnsiCategorySchemaResolver = zodResolver(createAnsiCategorySchema);
const updateAnsiCategorySchemaResolver = zodResolver(updateAnsiCategorySchema);

interface AnsiCategoryDetailsFormProps {
  ansiCategory?: AnsiCategory;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  name: "",
  description: "",
  color: "",
} satisfies TForm;

export default function AnsiCategoryDetailsForm({
  ansiCategory,
  onSubmitted,
}: AnsiCategoryDetailsFormProps) {
  const isNew = !ansiCategory;

  const form = useForm<TForm>({
    resolver: isNew
      ? createAnsiCategorySchemaResolver
      : updateAnsiCategorySchemaResolver,
    values: ansiCategory
      ? {
          ...ansiCategory,
          description: ansiCategory.description ?? "",
          color: ansiCategory.color ?? "",
        }
      : FORM_DEFAULTS,
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const color = watch("color");

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/ansi-categories",
      id: ansiCategory?.id,
    });
  };

  return (
    <Form {...form}>
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
        <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
