import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid as isValidDate, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Consumable } from "~/lib/models";
import { createConsumableSchema, updateConsumableSchema } from "~/lib/schema";
import LegacyIdField from "../legacy-id-field";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import ConsumableCombobox from "./consumable-combobox";

type TForm = z.infer<typeof updateConsumableSchema | typeof createConsumableSchema>;

interface ConsumableDetailsFormProps {
  consumable?: Consumable;
  onSubmitted?: () => void;
  assetId: string;
  parentProductId: string;
}

export default function ConsumableDetailsForm({
  consumable,
  onSubmitted,
  assetId,
  parentProductId,
}: ConsumableDetailsFormProps) {
  const isNew = !consumable;

  const FORM_DEFAULTS = {
    quantity: 1,
    expiresOn: undefined,
    asset: {
      connect: {
        id: assetId,
      },
    },
  } satisfies TForm;

  const form = useForm({
    resolver: zodResolver(isNew ? createConsumableSchema : updateConsumableSchema),
    values: consumable
      ? {
          ...consumable,
          legacyInventoryId: consumable.legacyInventoryId,
          expiresOn: consumable.expiresOn ?? undefined,
          asset: {
            connect: {
              id: consumable.assetId,
            },
          },
          product: {
            connect: { id: consumable.productId },
          },
          site: {
            connect: { id: consumable.siteId },
          },
        }
      : {
          ...FORM_DEFAULTS,
          legacyInventoryId: undefined,
        },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const { createOrUpdateJson: submit, isSubmitting } = useModalFetcher({
    onSubmitted,
  });

  const handleSubmit = (data: TForm) => {
    // Remove undefined values to make it JSON-serializable
    const cleanedData = JSON.parse(JSON.stringify(data));
    submit(cleanedData, {
      path: `/api/proxy/consumables`,
      id: consumable?.id,
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Input type="hidden" {...form.register("id")} hidden />
        <Input type="hidden" {...form.register("asset.connect.id")} hidden />
        <LegacyIdField
          form={form}
          fieldName="legacyInventoryId"
          label="Legacy Inventory ID"
          description="Inventory ID from the legacy Shield system"
        />

        <FormField
          control={form.control}
          name="product.connect.id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supply</FormLabel>
              <FormControl>
                <ConsumableCombobox
                  parentProductId={parentProductId}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  className="flex w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" {...field} min={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiresOn"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Expires On</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={
                    isValidDate(parseISO(String(value)))
                      ? format(parseISO(String(value)), "yyyy-MM-dd")
                      : undefined
                  }
                  onChange={(e) => {
                    onChange(parseISO(e.target.value).toISOString());
                  }}
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
    </Form>
  );
}
