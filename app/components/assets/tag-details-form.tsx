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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { Tag } from "~/lib/models";
import {
  createTagSchema,
  createTagSchemaResolver,
  updateTagSchema,
  updateTagSchemaResolver,
} from "~/lib/schema";
import ClientCombobox from "../clients/client-combobox";
import SiteCombobox from "../clients/site-combobox";

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

  const form = useForm<TForm>({
    resolver: tag ? updateTagSchemaResolver : createTagSchemaResolver,
    values: tag
      ? {
          ...tag,
          asset: tag.asset?.id
            ? {
                connect: {
                  id: tag.asset.id,
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
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
    watch,
  } = form;

  const clientId = watch("client.connect.id");

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/tags",
      id: tag?.id,
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
          name="client.connect.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {field.value ? "Assign client" : "Assigned client"}
              </FormLabel>
              <FormControl>
                <ClientCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="site.connect.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {field.value ? "Assign site" : "Assigned site"}
              </FormLabel>
              <FormControl>
                <SiteCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  className="w-full"
                  clientId={clientId}
                  disabled={!clientId}
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
