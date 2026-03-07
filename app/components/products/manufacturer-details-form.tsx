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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useRequestedAccessContext } from "~/contexts/requested-access-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Manufacturer } from "~/lib/models";
import { createManufacturerSchema, updateManufacturerSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import ActiveToggleFormInput from "../active-toggle-form-input";
import { ResponsiveModalBody, ResponsiveModalFooter } from "../responsive-modal";

type TForm = z.infer<typeof createManufacturerSchema | typeof updateManufacturerSchema>;
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
  const { currentClientId, accessIntent } = useRequestedAccessContext();

  const form = useForm<TForm>({
    resolver: zodResolver(isNew ? createManufacturerSchema : updateManufacturerSchema),
    values: manufacturer
      ? {
          ...manufacturer,
          homeUrl: manufacturer.homeUrl ?? "",
          client: manufacturer.client ? { connect: { id: manufacturer.client.id } } : undefined,
        }
      : {
          ...FORM_DEFAULTS,
          client:
            accessIntent !== "system" && currentClientId
              ? {
                  connect: { id: currentClientId },
                }
              : undefined,
        },
  });

  const {
    formState: { isDirty },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
      path: "/api/proxy/manufacturers",
      id: manufacturer?.id,
    });
  };

  return (
    <FormProvider {...form}>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(handleSubmit)}>
        <ResponsiveModalBody className="space-y-4">
          <Input type="hidden" {...form.register("id")} hidden />
          <ActiveToggleFormInput />
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
        </ResponsiveModalBody>
        <ResponsiveModalFooter>
          <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty)}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </ResponsiveModalFooter>
      </form>
    </FormProvider>
  );
}
