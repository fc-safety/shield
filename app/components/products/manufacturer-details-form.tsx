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
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Manufacturer } from "~/lib/models";
import {
  createManufacturerSchemaResolver,
  updateManufacturerSchemaResolver,
  type createManufacturerSchema,
  type updateManufacturerSchema,
} from "~/lib/schema";

type TForm = z.infer<
  typeof createManufacturerSchema | typeof updateManufacturerSchema
>;
interface ManufacturerDetailsFormProps {
  manufacturer?: Manufacturer;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  id: "",
  active: true,
  name: "",
  homeUrl: "",
} satisfies TForm;

export default function ManufacturerDetailsForm({
  manufacturer,
  onSubmitted,
}: ManufacturerDetailsFormProps) {
  const isNew = !manufacturer;

  const form = useForm<TForm>({
    resolver: isNew
      ? createManufacturerSchemaResolver
      : updateManufacturerSchemaResolver,
    values: manufacturer
      ? {
          ...manufacturer,
          homeUrl: manufacturer.homeUrl ?? "",
          client: manufacturer.client
            ? { connect: { id: manufacturer.client.id } }
            : undefined,
        }
      : FORM_DEFAULTS,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: "/api/proxy/manufacturers",
      id: manufacturer?.id,
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
          name="homeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home URL</FormLabel>
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
      </form>
    </FormProvider>
  );
}
