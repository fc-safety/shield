import { Eraser, Plus } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import HelpPopover from "~/components/help-popover";
import { Button } from "~/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";

type TMetadataForm = { metadata: Record<string, string> };
export default function MetadataInput() {
  const form = useFormContext<TMetadataForm>();

  return (
    <FormField
      control={form.control}
      name="metadata"
      render={({ field }) => {
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
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Metadata
              <HelpPopover>
                Metadata can be used to store additional information about the asset.
              </HelpPopover>
              <Button
                variant="outline"
                size="iconSm"
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
            </FormLabel>
            <FormControl>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
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
            </FormControl>
            <FormMessage />
          </FormItem>
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
      <Input
        autoFocus={false}
        value={metadataKey}
        onChange={(e) => onKeyChange(e.target.value)}
        onBlur={() => {
          if (valueBlurred) {
            onBlur();
          }
        }}
      />
      <Input
        autoFocus={false}
        value={metadataValue}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={() => {
          onBlur();
          setValueBlurred(true);
        }}
      />
      <Button variant="ghost" size="iconSm" type="button" onClick={() => onDelete()}>
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
