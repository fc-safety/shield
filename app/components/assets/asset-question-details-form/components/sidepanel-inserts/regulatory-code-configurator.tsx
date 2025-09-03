import { useFormContext } from "react-hook-form";
import type z from "zod";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "regulatoryCodes">;

export default function RegulatoryCodeConfigurator() {
  const { data: contextData } = useAssetQuestionDetailFormContext();

  const idx = (contextData.idx ?? 0) as number;
  const regulatoryCodeAction = contextData.action as "create" | "update";

  const { watch, control } = useFormContext<TForm>();

  const regulatoryCodeDataInput = watch(
    regulatoryCodeAction === "create"
      ? `regulatoryCodes.create.${idx}`
      : `regulatoryCodes.update.${idx}.data`
  );

  return regulatoryCodeDataInput ? (
    <div className="space-y-6" key={`${idx}-${regulatoryCodeAction}`}>
      <div>
        <h3 className="text-lg font-medium">Configure Regulatory Code</h3>
        <p className="text-muted-foreground text-sm">
          Regulatory codes help track compliance requirements and regulations. Each code should
          reference a specific regulation, standard, or compliance requirement that applies to this
          asset question.
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.active`
              : `regulatoryCodes.update.${idx}.data.active`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <div className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={value} onCheckedChange={onChange} onBlur={onBlur} />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.codeIdentifier`
              : `regulatoryCodes.update.${idx}.data.codeIdentifier`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Code Identifier</FormLabel>
              <FormControl>
                <Input
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., ISO-9001, OSHA-1910.147, FDA-21CFR820"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.title`
              : `regulatoryCodes.update.${idx}.data.title`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Brief title of the regulation"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.governingBody`
              : `regulatoryCodes.update.${idx}.data.governingBody`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Governing Body</FormLabel>
              <FormControl>
                <Input
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., ISO, OSHA, FDA, ANSI"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.section`
              : `regulatoryCodes.update.${idx}.data.section`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Section (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Specific section or clause of the regulation that applies"
                  rows={2}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.sourceUrl`
              : `regulatoryCodes.update.${idx}.data.sourceUrl`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Source URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., https://www.iso.org/standard/12345.html"
                  type="url"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.documentVersion`
              : `regulatoryCodes.update.${idx}.data.documentVersion`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Document Version (Optional)</FormLabel>
              <FormControl>
                <Input
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., 2023-06, Rev 3.1, Version 2.0"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  ) : (
    <p className="text-muted-foreground w-full text-center text-sm">No data selected.</p>
  );
}

RegulatoryCodeConfigurator.Id = "regulatory-code-configurator";