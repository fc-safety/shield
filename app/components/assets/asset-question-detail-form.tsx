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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "react-router";
import { useRemixForm } from "remix-hook-form";
import type { z } from "zod";
import {
  AssetQuestionResponseTypes,
  AssetQuestionTypes,
  type AssetQuestion,
} from "~/lib/models";
import {
  createAssetQuestionSchemaResolver,
  updateAssetQuestionSchemaResolver,
  type createAssetQuestionSchema,
  type updateAssetQuestionSchema,
} from "~/lib/schema";

type TForm = z.infer<
  typeof updateAssetQuestionSchema | typeof createAssetQuestionSchema
>;

export interface AssetQuestionDetailFormProps {
  assetQuestion?: AssetQuestion;
  onSubmitted?: () => void;
}

const FORM_DEFAULTS = {
  active: true,
  type: "INSPECTION",
  required: false,
  prompt: "",
  valueType: "TEXT",
} satisfies TForm;

export default function AssetQuestionDetailForm({
  assetQuestion,
  onSubmitted,
}: AssetQuestionDetailFormProps) {
  const isNew = !assetQuestion;

  const form = useRemixForm<TForm>({
    resolver: assetQuestion
      ? updateAssetQuestionSchemaResolver
      : createAssetQuestionSchemaResolver,
    values: assetQuestion
      ? {
          ...assetQuestion,
          order: assetQuestion.order || undefined,
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
        action={
          isNew ? "?action=add-asset-question" : "?action=update-asset-question"
        }
        onSubmit={(e) => {
          form.handleSubmit(e).then(() => {
            onSubmitted?.();
          });
        }}
      >
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
          name="type"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  {...field}
                  onValueChange={onChange}
                  className="flex gap-4"
                >
                  {AssetQuestionTypes.map((type, idx) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={type}
                        id={"questionStatus" + idx}
                      />
                      <Label
                        className="capitalize"
                        htmlFor={"questionStatus" + idx}
                      >
                        {type.toLowerCase()}
                      </Label>
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
          name="required"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Required</FormLabel>
              <FormControl>
                <Switch
                  checked={value}
                  onCheckedChange={onChange}
                  className="flex"
                  onBlur={onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="valueType"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Answer Type</FormLabel>
              <FormControl>
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger className="h-8 capitalize" onBlur={onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {AssetQuestionResponseTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="capitalize"
                      >
                        {type.replace("_", " ").toLowerCase()}
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
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
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
