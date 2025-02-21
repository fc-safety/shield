import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalSubmit } from "~/hooks/use-modal-submit";
import type { InspectionRoute, InspectionRoutePoint } from "~/lib/models";
import {
  createInspectionRoutePointSchema,
  updateInspectionRoutePointSchema,
} from "~/lib/schema";
import AssetCombobox from "../assets/asset-combobox";
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

type TForm = z.infer<
  | typeof updateInspectionRoutePointSchema
  | typeof createInspectionRoutePointSchema
>;
interface RoutePointDetailsFormProps {
  route: InspectionRoute;
  routePoint?: InspectionRoutePoint;
  onSubmitted?: () => void;
}

const createInspectionRouteSchemaResolver = zodResolver(
  createInspectionRoutePointSchema
);
const updateInspectionRouteSchemaResolver = zodResolver(
  updateInspectionRoutePointSchema
);

const FORM_DEFAULTS = {
  order: 0,
  assetId: "",
} satisfies TForm;

export default function RoutePointDetailsForm({
  route,
  routePoint,
  onSubmitted,
}: RoutePointDetailsFormProps) {
  const isNew = !routePoint;

  const proposedOrderNumber = useMemo(() => {
    if (!route.inspectionRoutePoints) return 0;
    return (
      (route.inspectionRoutePoints.sort((a, b) => a.order - b.order).at(-1)
        ?.order ?? -1) + 1
    );
  }, [route.inspectionRoutePoints]);

  const includedAssetIds = useMemo(() => {
    if (!route.inspectionRoutePoints) return new Set<string>();
    return new Set(route.inspectionRoutePoints.map((point) => point.assetId));
  }, [route.inspectionRoutePoints]);

  const form = useForm<TForm>({
    resolver: isNew
      ? createInspectionRouteSchemaResolver
      : updateInspectionRouteSchemaResolver,
    values: isNew
      ? {
          ...FORM_DEFAULTS,
          order: proposedOrderNumber,
        }
      : routePoint,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalSubmit({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    submit(data, {
      path: `/api/proxy/inspection-routes/${route.id}/points`,
      id: routePoint?.id,
      query: {
        _throw: "false",
      },
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <Input type="hidden" {...form.register("order")} hidden />

        <FormField
          control={form.control}
          name="assetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset</FormLabel>
              <FormControl>
                <AssetCombobox
                  className="w-full"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  optionFilter={(asset) => !includedAssetIds.has(asset.id)}
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
    </Form>
  );
}
