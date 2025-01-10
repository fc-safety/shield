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
import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import { z } from "zod";
import type { Tag } from "~/lib/models";
import {
  createTagSchema,
  createTagSchemaResolver,
  updateTagSchema,
  updateTagSchemaResolver,
} from "~/lib/schema";

type TForm = z.infer<typeof updateTagSchema | typeof createTagSchema>;
interface TagDetailsFormProps {
  tag?: Tag;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  serialNumber: "",
} satisfies TForm;

export default function TagDetailsForm({
  tag,
  onSubmitted,
}: TagDetailsFormProps) {
  const isNew = !tag;

  const form = useRemixForm<TForm>({
    resolver: tag ? updateTagSchemaResolver : createTagSchemaResolver,
    values: tag
      ? {
          ...tag,
          asset: tag.assetId
            ? {
                connect: {
                  id: tag.assetId,
                },
              }
            : undefined,
          site: tag.siteId
            ? {
                connect: {
                  id: tag.siteId,
                },
              }
            : undefined,
          client: tag.clientId
            ? {
                connect: {
                  id: tag.clientId,
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
