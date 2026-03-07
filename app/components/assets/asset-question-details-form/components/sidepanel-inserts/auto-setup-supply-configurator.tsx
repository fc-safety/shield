import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useFormContext } from "react-hook-form";
import type z from "zod";
import ConsumableCombobox from "~/components/assets/consumable-combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { ConsumableMappingTypes } from "~/lib/models";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { humanize } from "~/lib/utils";
import { EmptySidepanel } from "../empty-sidepanel";

export const AutoSetupSupplyConfigurator = () => {
  const { watch, control } = useFormContext<{
    consumableConfig: z.infer<typeof updateAssetQuestionSchema>["consumableConfig"];
  }>();
  const autoSetupSupplyConfigInput = watch("consumableConfig");
  return autoSetupSupplyConfigInput ? (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configure Automatic Supply Setup</h3>
        <p className="text-muted-foreground text-sm">
          Configure a supply to be setup automatically when a user answers this question during an
          inspection.
        </p>
      </div>
      <Controller
        control={control}
        name={
          autoSetupSupplyConfigInput.create
            ? "consumableConfig.create.consumableProduct.connect.id"
            : "consumableConfig.update.consumableProduct.connect.id"
        }
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Supply</FieldLabel>
            <ConsumableCombobox
              value={field.value}
              onValueChange={(v) => field.onChange(v ?? "")}
              onBlur={field.onBlur}
              compactClearButton
            />
            <FieldDescription>
              This is the supply that will be added once the asset setup is complete.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name={
          autoSetupSupplyConfigInput.create
            ? "consumableConfig.create.mappingType"
            : "consumableConfig.update.mappingType"
        }
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Mapping Type</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger onBlur={field.onBlur}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ConsumableMappingTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {humanize(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              This mapping type determines how the data from the inspector's response will be used
              when configuring the new supply.
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  ) : (
    <EmptySidepanel />
  );
};

AutoSetupSupplyConfigurator.Id = "automatic-setup-supply-configurator";
