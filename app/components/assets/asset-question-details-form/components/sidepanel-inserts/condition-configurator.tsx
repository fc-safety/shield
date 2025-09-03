import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import type z from "zod";
import { conditionTypeVariants } from "~/components/assets/condition-pill";
import MetadataKeyCombobox from "~/components/metadata-key-combobox";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import {
  AssetQuestionConditionTypes,
  type AssetQuestionConditionType,
  type Manufacturer,
  type Product,
  type ProductCategory,
  type ResultsPage,
} from "~/lib/models";
import type { updateAssetQuestionSchema } from "~/lib/schema";
import { cn, humanize } from "~/lib/utils";
import { useAssetQuestionDetailFormContext } from "../../asset-question-detail-form.context";

type TForm = Pick<z.infer<typeof updateAssetQuestionSchema>, "conditions">;

const fuse = new Fuse([] as { label: string; value: string }[], {
  keys: ["searchString"],
  threshold: 0.4,
});

export const ConditionConfigurator = () => {
  const { data: contextData } = useAssetQuestionDetailFormContext();

  const idx = (contextData.idx ?? 0) as number;
  const conditionAction = contextData.action as "create" | "update";

  const { watch, control, setValue } = useFormContext<TForm>();

  const conditionDataInput = watch(
    conditionAction === "create"
      ? `conditions.createMany.data.${idx}`
      : `conditions.updateMany.${idx}.data`
  );

  return conditionDataInput ? (
    <div className="space-y-6" key={`${idx}-${conditionAction}`}>
      <div>
        <h3 className="text-lg font-medium">Configure Condition</h3>
        <p className="text-muted-foreground text-sm">
          Conditions determine whether a question is displayed for a given asset during an
          inspection.
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={control}
          name={
            conditionAction === "create"
              ? `conditions.createMany.data.${idx}.conditionType`
              : `conditions.updateMany.${idx}.data.conditionType`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>Condition Type</FormLabel>
              <FormControl>
                <Select
                  value={value}
                  onValueChange={(v) => {
                    setValue(
                      conditionAction === "create"
                        ? `conditions.createMany.data.${idx}.value.0`
                        : `conditions.updateMany.${idx}.data.value.0`,
                      "",
                      { shouldDirty: true }
                    );
                    onChange(v);
                  }}
                >
                  <SelectTrigger onBlur={onBlur} className={conditionTypeVariants({ type: value })}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AssetQuestionConditionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {humanize(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={
            conditionAction === "create"
              ? `conditions.createMany.data.${idx}.value.0`
              : `conditions.updateMany.${idx}.data.value.0`
          }
          render={({ field: { onChange, onBlur, value } }) => (
            <FormItem>
              <FormLabel>
                {conditionDataInput?.conditionType === "METADATA"
                  ? "Metadata Key"
                  : "Matching Value"}
              </FormLabel>
              <FormControl>
                <MatchingValueInput
                  value={(() => {
                    if (conditionDataInput?.conditionType === "METADATA") {
                      return value.split(":")[0] ?? value;
                    }
                    return value;
                  })()}
                  onValueChange={(v) => {
                    if (v && conditionDataInput?.conditionType === "METADATA") {
                      const colonIdx = value.indexOf(":");
                      if (colonIdx > -1) {
                        onChange(v + value.slice(colonIdx));
                      } else {
                        onChange(v + ":");
                      }
                    } else {
                      onChange(v);
                    }
                  }}
                  onBlur={onBlur}
                  conditionType={conditionDataInput?.conditionType}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {conditionDataInput?.conditionType === "METADATA" && (
          <FormField
            control={control}
            name={
              conditionAction === "create"
                ? `conditions.createMany.data.${idx}.value.0`
                : `conditions.updateMany.${idx}.data.value.0`
            }
            render={({ field: { onChange, onBlur, value } }) => (
              <FormItem>
                <FormLabel>Metadata Value</FormLabel>
                <FormControl>
                  <Input
                    value={value.split(":")[1] || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const colonIdx = value.indexOf(":");
                      if (colonIdx > -1) {
                        onChange(value.slice(0, colonIdx + 1) + v);
                      } else {
                        onChange(":" + v);
                      }
                    }}
                    onBlur={onBlur}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  ) : (
    <p className="text-muted-foreground w-full text-center text-sm">No data selected.</p>
  );
};

ConditionConfigurator.Id = "condition-configurator";

function MatchingValueInput({
  value,
  onValueChange,
  onBlur,
  conditionType,
}: {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  onBlur: () => void;
  conditionType: AssetQuestionConditionType | undefined;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const [optionsSearchQuery, setOptionsSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: valueOptionsRaw, isLoading } = useQuery({
    queryKey: ["asset-question-condition-value-options", conditionType] as const,
    queryFn: ({ queryKey }) => getValueOptionsForType(fetchOrThrow, queryKey[1]),
    enabled: !!conditionType,
  });

  const valueOptionGroups = useMemo(() => {
    let options = valueOptionsRaw ? [...valueOptionsRaw] : [];

    options = options.sort((a, b) => {
      if (a.groupLabel && b.groupLabel && a.groupLabel !== b.groupLabel) {
        return a.groupLabel.localeCompare(b.groupLabel);
      }
      return a.label.localeCompare(b.label);
    });

    if (options.length > 0 && optionsSearchQuery) {
      fuse.setCollection(options);
      options = fuse.search(optionsSearchQuery).map((r) => r.item);
    }

    return Object.values(
      options.reduce(
        (acc, o) => {
          const groupLabel = o.groupLabel ?? "";
          if (!acc[groupLabel]) {
            acc[groupLabel] = {
              label: groupLabel,
              options: [],
            };
          }
          acc[groupLabel].options.push(o);
          return acc;
        },
        {} as Record<string, ValueOptionGroup>
      )
    );
  }, [valueOptionsRaw, optionsSearchQuery]);

  const selectedOptionLabel = useMemo(() => {
    if (!valueOptionsRaw) return undefined;
    return valueOptionsRaw.find((o) => o.value === value)?.label;
  }, [valueOptionsRaw, value]);

  if (conditionType === "METADATA") {
    return <MetadataKeyCombobox value={value} onValueChange={onValueChange} onBlur={onBlur} />;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("flex-1 justify-between text-start")}>
          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              selectedOptionLabel ||
              value ||
              `Select ${humanize(conditionType, { lowercase: true })}...`
            )}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search for a value..."
            value={optionsSearchQuery}
            onValueChange={setOptionsSearchQuery}
            onBlur={onBlur}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {isLoading && (
              <CommandGroup>
                {isLoading && (
                  <CommandItem key="loading" disabled>
                    <Loader2 className="size-4 animate-spin" />
                  </CommandItem>
                )}
              </CommandGroup>
            )}
            {valueOptionGroups?.map(({ label, options }) => (
              <CommandGroup key={label} heading={label}>
                {options.map((option, idx) => (
                  <CommandItem
                    key={`${option.value}-${option.label}-${idx}`}
                    value={option.value}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOptionsSearchQuery("");
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ValueOption {
  label: string;
  value: string;
  searchString?: string;
  groupLabel?: string;
}

interface ValueOptionGroup {
  label?: string;
  options: ValueOption[];
}

const getValueOptionsForType = async (
  fetcher: typeof fetch,
  conditionType: AssetQuestionConditionType | undefined
): Promise<ValueOption[]> => {
  let options = [] as ValueOption[];

  switch (conditionType) {
    case "REGION":
      options = await fetcher(`/asset-questions/region-options/states`)
        .then((r) => r.json() as Promise<{ code: string; name: string }[]>)
        .then((r) =>
          r.map((s) => ({
            label: s.name,
            value: s.code,
            searchString: `${s.name} ${s.code}`,
          }))
        );
      break;
    case "MANUFACTURER":
      options = await fetcher(`/manufacturers?limit=1000`)
        .then((r) => r.json() as Promise<ResultsPage<Manufacturer>>)
        .then((r) =>
          r.results.map((m) => ({
            label: m.name,
            value: m.id,
            searchString: m.name,
          }))
        );
      break;
    case "PRODUCT_CATEGORY":
      options = await fetcher(`/product-categories?limit=1000`)
        .then((r) => r.json() as Promise<ResultsPage<ProductCategory>>)
        .then((r) =>
          r.results.map((pc) => ({
            label: pc.name,
            value: pc.id,
            searchString: [pc.name, pc.shortName].filter(Boolean).join(" "),
          }))
        );
      break;
    case "PRODUCT":
      options = await fetcher(`/products?limit=1000&type=PRIMARY`)
        .then((r) => r.json() as Promise<ResultsPage<Product>>)
        .then((r) =>
          r.results.map((p) => ({
            label: p.name,
            value: p.id,
            searchString: [p.name, p.productCategory?.name, p.productCategory?.shortName]
              .filter(Boolean)
              .join(" "),
            groupLabel: p.productCategory?.name ?? "Other",
          }))
        );
      break;
    case "METADATA":
      options = await fetcher(`/assets/metadata-keys`)
        .then((r) => r.json() as Promise<string[]>)
        .then((r) =>
          r.map((key) => ({
            label: key,
            value: key,
            searchString: key,
          }))
        );
      break;
  }

  return options;
};
