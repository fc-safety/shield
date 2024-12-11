import { useRemixForm } from "remix-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { type Asset, assetTypes } from "~/lib/demo-data";
import { assetSchema, assetSchemaResolver } from "~/lib/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

interface AssetDetailsFormProps {
  asset: Asset;
}

type TForm = z.infer<typeof assetSchema>;

export default function AssetDetailsForm({ asset }: AssetDetailsFormProps) {
  const form = useRemixForm<TForm>({
    resolver: assetSchemaResolver,
    values: asset,
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  return (
    <Form {...form}>
      <form className="space-y-8" method="post" onSubmit={form.handleSubmit}>
        <Input type="hidden" {...form.register("id")} hidden />
        <FormField
          control={form.control}
          name="active"
          render={({ field: { onChange, ...field } }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={onChange}
                  className="pt-0"
                />
              </FormControl>
              <FormLabel>Active</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          render={({ field: { onChange, onBlur, ref, ...rest } }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select {...rest} onValueChange={onChange}>
                  <SelectTrigger className="h-8" onBlur={onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {assetTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is the number on the NFC tag.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="placement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placement</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={!isDirty || !isValid}>
          Save
        </Button>
      </form>
    </Form>
  );
}
