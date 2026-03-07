import { Controller, useFormContext } from "react-hook-form";
import type z from "zod";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";
import { EmptySidepanel } from "../empty-sidepanel";

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
        <Controller
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.governingBody`
              : `regulatoryCodes.update.${idx}.data.governingBody`
          }
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Governing Body / Agency</FieldLabel>
              <Input
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g., ISO, OSHA, FDA, ANSI"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.codeIdentifier`
              : `regulatoryCodes.update.${idx}.data.codeIdentifier`
          }
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Code Identifier</FieldLabel>
              <Input
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g., ISO-9001, OSHA-1910.147, FDA-21CFR820"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.title`
              : `regulatoryCodes.update.${idx}.data.title`
          }
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Title (Optional)</FieldLabel>
              <Input
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Brief title of the regulation"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.section`
              : `regulatoryCodes.update.${idx}.data.section`
          }
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Section (Optional)</FieldLabel>
              <Textarea
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Specific section or clause of the regulation that applies"
                rows={2}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.sourceUrl`
              : `regulatoryCodes.update.${idx}.data.sourceUrl`
          }
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Source URL (Optional)</FieldLabel>
              <Input
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g., https://www.iso.org/standard/12345.html"
                type="url"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name={
            regulatoryCodeAction === "create"
              ? `regulatoryCodes.create.${idx}.documentVersion`
              : `regulatoryCodes.update.${idx}.data.documentVersion`
          }
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Document Version (Optional)</FieldLabel>
              <Input
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="e.g., 2023-06, Rev 3.1, Version 2.0"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  ) : (
    <EmptySidepanel />
  );
}

RegulatoryCodeConfigurator.Id = "regulatory-code-configurator";
