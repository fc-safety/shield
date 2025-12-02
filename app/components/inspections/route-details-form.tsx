import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useAuth } from "~/contexts/auth-context";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { InspectionRoute } from "~/lib/models";
import { createInspectionRouteSchema, updateInspectionRouteSchema } from "~/lib/schema";
import { serializeFormJson } from "~/lib/serializers";
import { hasMultiSiteVisibility } from "~/lib/users";
import SiteCombobox from "../clients/site-combobox";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type TForm = z.infer<typeof updateInspectionRouteSchema | typeof createInspectionRouteSchema>;
interface RouteDetailsFormProps {
  route?: InspectionRoute;
  onSubmitted?: () => void;
}

const createInspectionRouteSchemaResolver = zodResolver(createInspectionRouteSchema);
const updateInspectionRouteSchemaResolver = zodResolver(updateInspectionRouteSchema);

const FORM_DEFAULTS = {
  name: "",
  description: "",
  inspectionRoutePoints: [],
} satisfies TForm;

export default function RouteDetailsForm({ route, onSubmitted }: RouteDetailsFormProps) {
  const { user } = useAuth();

  const isNew = !route;

  const form = useForm({
    resolver: zodResolver(isNew ? createInspectionRouteSchema : updateInspectionRouteSchema),
    values: (isNew
      ? FORM_DEFAULTS
      : {
          ...route,
          description: route.description ?? undefined,
          inspectionRoutePoints: undefined,
        }) as TForm,
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(serializeFormJson(data), {
      path: "/api/proxy/inspection-routes",
      id: route?.id,
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
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

        {hasMultiSiteVisibility(user) && (
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site</FormLabel>
                <FormControl>
                  <SiteCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="w-full"
                    showClear={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting || (!isNew && !isDirty) || !isValid}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
