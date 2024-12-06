import { zodResolver } from "@hookform/resolvers/zod";
import { ControllerRenderProps, Path, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Asset,
  assetManufacturers,
  assetSites,
  assetStatuses,
  assetTypes,
} from "~/lib/demo-data";
import { Button } from "../ui/button";
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
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AssetDetailsFormProps {
  asset: Asset;
}

const formSchema = z.object({
  id: z.string().optional(),
  type: z.enum(assetTypes),
  tag: z.string(),
  site: z.enum(assetSites),
  location: z.string(),
  placement: z.string(),
  manufactuer: z.enum(assetManufacturers),
  status: z.enum(assetStatuses),
});

type TForm = z.infer<typeof formSchema>;

export default function AssetDetailsForm({ asset }: AssetDetailsFormProps) {
  const form = useForm<TForm>({
    resolver: zodResolver(formSchema),
    defaultValues: asset,
  });

  return (
    <Form {...form}>
      <form className="space-y-8" method="post">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>{buildSelect(field, assetTypes)}</FormControl>
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
          name="status"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup {...field} onValueChange={onChange}>
                  {assetStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <RadioGroupItem value={status} />
                      <Label className="capitalize">{status}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
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
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}

function buildSelect(
  field: ControllerRenderProps<TForm, Path<TForm>>,
  options: readonly string[]
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onChange, onBlur, ref, ...rest } = field;
  return (
    <Select {...rest} onValueChange={onChange}>
      <SelectTrigger className="h-8" onBlur={onBlur}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent side="top">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
