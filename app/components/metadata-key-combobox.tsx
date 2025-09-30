import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const fuse = new Fuse([] as { label: string; value: string }[], { keys: ["label"] });

export default function MetadataKeyCombobox({
  value,
  onValueChange,
  onBlur,
  className,
  placeholder,
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const [optionsSearchQuery, setOptionsSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: valueOptionsRaw, isLoading } = useQuery({
    queryKey: ["metadata-keys"] as const,
    queryFn: () => getMetadataKeys(fetchOrThrow),
  });

  const [newOrCustomValueOptions, setNewOrCustomValueOptions] = useImmer(
    new Map<string, ValueOption>()
  );

  const valueOptionGroups = useMemo(() => {
    let options = valueOptionsRaw ? [...valueOptionsRaw] : [];

    options.unshift(...newOrCustomValueOptions.values());

    if (options.length > 0 && optionsSearchQuery) {
      fuse.setCollection(options);
      options = fuse.search(optionsSearchQuery).map((r) => r.item);
    }

    return Object.values(
      options
        .sort((a, b) => {
          if (a.groupLabel && b.groupLabel && a.groupLabel !== b.groupLabel) {
            return a.groupLabel.localeCompare(b.groupLabel);
          }
          return a.label.localeCompare(b.label);
        })
        .reduce(
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
  }, [valueOptionsRaw, optionsSearchQuery, newOrCustomValueOptions]);

  const selectedOptionLabel = useMemo(() => {
    if (!valueOptionsRaw) return undefined;
    return valueOptionsRaw.find((o) => o.value === value)?.label;
  }, [valueOptionsRaw, value]);

  const addOption = useMemo<{ fn: () => void; label: React.ReactNode } | undefined>(() => {
    if (optionsSearchQuery.length > 1) {
      const cleanedNewValue = optionsSearchQuery.replace(/[:,]/g, "");
      const fn = () => {
        setNewOrCustomValueOptions((draft) => {
          draft.set(cleanedNewValue, { label: cleanedNewValue, value: cleanedNewValue });
        });
        onValueChange(cleanedNewValue);
        setOptionsSearchQuery("");
        setIsOpen(false);
      };
      return {
        fn,
        label: (
          <div>
            Add <span className="font-semibold italic">{cleanedNewValue}</span>
          </div>
        ),
      };
    }
  }, [optionsSearchQuery]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("flex-1 justify-between text-start", className)}
        >
          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              selectedOptionLabel || value || placeholder || `Select metadata key...`
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
            {(isLoading || addOption) && (
              <CommandGroup>
                {addOption && (
                  <CommandItem key="add-option" onSelect={addOption.fn} disabled={isLoading}>
                    <Plus className="size-4" />
                    {addOption.label}
                  </CommandItem>
                )}
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
  groupLabel?: string;
}

interface ValueOptionGroup {
  label?: string;
  options: ValueOption[];
}

const getMetadataKeys = async (fetcher: typeof fetch): Promise<ValueOption[]> => {
  return await fetcher(`/assets/metadata-keys`)
    .then((r) => r.json() as Promise<string[]>)
    .then((r) =>
      r.map((key) => ({
        label: key,
        value: key,
      }))
    );
};
