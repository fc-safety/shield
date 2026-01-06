import { Eraser, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import HelpPopover from "~/components/help-popover";
import MetadataKeyCombobox from "~/components/metadata-key-combobox";
import MetadataValueCombobox from "~/components/metadata-value-combobox";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";

type TMetadataForm = { metadata: Record<string, string> };
export default function MetadataInputField() {
  const form = useFormContext<TMetadataForm>();

  return (
    <Controller
      control={form.control}
      name="metadata"
      render={({ field, fieldState }) => {
        const metadataArray = Object.entries(field.value ?? { "": "" });

        const updateKey = (idx: number, key: string) => {
          const newMetadata = [...metadataArray];
          newMetadata[idx][0] = key;
          field.onChange(arrayToObject(newMetadata));
        };

        const updateValue = (idx: number, value: string) => {
          const newMetadata = [...metadataArray];
          newMetadata[idx][1] = value;
          field.onChange(arrayToObject(newMetadata));
        };

        const deleteMetadata = (idx: number) => {
          const newMetadata = [...metadataArray];
          newMetadata.splice(idx, 1);
          field.onChange(arrayToObject(newMetadata));
          field.onBlur();
        };

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="flex items-center gap-2">
              Metadata
              <HelpPopover>
                Metadata can be used to store additional information about the asset.
              </HelpPopover>
              <Button
                variant="outline"
                size="icon-sm"
                type="button"
                className="size-5"
                onClick={() => {
                  field.onChange({
                    ...(field.value ?? {}),
                    [""]: "",
                  });
                }}
              >
                <Plus />
              </Button>
            </FieldLabel>
            <div className="grid w-full grid-cols-[1fr_1fr_auto] gap-2">
              {metadataArray.length > 0 && (
                <>
                  <span className="text-xs font-medium">Key</span>
                  <span className="text-xs font-medium">Value</span>
                  <span></span>
                </>
              )}

              {metadataArray.map(([key, value], idx) => (
                <MetadataInputItem
                  key={idx}
                  metadataKey={key}
                  metadataValue={value}
                  onKeyChange={(k) => updateKey(idx, k)}
                  onValueChange={(v) => updateValue(idx, v)}
                  onBlur={field.onBlur}
                  onDelete={() => deleteMetadata(idx)}
                />
              ))}

              {metadataArray.length === 0 && (
                <p className="text-muted-foreground col-span-full text-xs italic">No metadata.</p>
              )}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}

const MetadataInputItem = ({
  metadataKey,
  metadataValue,
  onKeyChange,
  onValueChange,
  onBlur,
  onDelete,
}: {
  metadataKey: string;
  metadataValue: string;
  onKeyChange: (key: string) => void;
  onValueChange: (value: string) => void;
  onDelete: () => void;
  onBlur: () => void;
}) => {
  const [valueBlurred, setValueBlurred] = useState(false);
  return (
    <>
      <MetadataKeyCombobox
        autoFocus={false}
        value={metadataKey}
        onValueChange={(e) => onKeyChange(e)}
        onBlur={() => {
          if (valueBlurred) {
            onBlur();
          }
        }}
        className="min-w-0 flex-1"
      />
      <MetadataValueCombobox
        autoFocus={false}
        metadataKey={metadataKey}
        value={metadataValue}
        onValueChange={(e) => onValueChange(e)}
        onBlur={() => {
          onBlur();
          setValueBlurred(true);
        }}
        className="min-w-0 flex-1"
      />
      <Button variant="ghost" size="icon-sm" type="button" onClick={() => onDelete()}>
        <Eraser className="size-4" />
      </Button>
    </>
  );
};

const arrayToObject = (array: [string, string][]) => {
  return array.reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );
};
