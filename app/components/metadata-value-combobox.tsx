import { useQuery, useQueryClient } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useImmer } from "use-immer";
import type { ViewContext } from "~/.server/api-utils";
import { useViewContext } from "~/contexts/view-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
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

export default function MetadataValueCombobox({
  metadataKey,
  value,
  onValueChange,
  onBlur,
  className,
  placeholder,
  autoFocus,
}: {
  metadataKey: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const viewContext = useViewContext();

  const { fetchOrThrow } = useAuthenticatedFetch();

  const [optionsSearchQuery, setOptionsSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useBlurOnClose({
    onBlur,
    open: isOpen,
  });

  const queryClient = useQueryClient();
  const { data: valueOptionsRaw, isLoading } = useQuery({
    queryKey: ["metadata-values", metadataKey, viewContext] as const,
    queryFn: ({ queryKey }) => getMetadataValues(fetchOrThrow, queryKey[1], queryKey[2]),
    enabled: !!metadataKey,
    staleTime: 0,
  });

  const [newOrCustomValueOptions, setNewOrCustomValueOptions] = useImmer(new Set<string>());

  // Reset new or custom value options when the metadata key changes.
  const initialMetadataKey = useRef(metadataKey).current;
  useEffect(() => {
    if (initialMetadataKey !== metadataKey) {
      setNewOrCustomValueOptions(new Set<string>());
      onValueChange("");
    }
  }, [metadataKey]);

  const options = useMemo(() => {
    let options = valueOptionsRaw ? [...valueOptionsRaw] : [];

    options.unshift(...newOrCustomValueOptions.values());

    if (options.length > 0 && optionsSearchQuery) {
      fuse.setCollection(options.map((o) => ({ label: o, value: o })));
      options = fuse.search(optionsSearchQuery).map((r) => r.item.value);
    }

    return Array.from(new Set(options));
  }, [valueOptionsRaw, optionsSearchQuery, newOrCustomValueOptions]);

  const addOption = useMemo<{ fn: () => void; label: React.ReactNode } | undefined>(() => {
    if (optionsSearchQuery.length > 0) {
      const cleanedNewValue = optionsSearchQuery.replace(/[:,]/g, "");
      const fn = () => {
        setNewOrCustomValueOptions((draft) => {
          draft.add(cleanedNewValue);
        });
        onValueChange(cleanedNewValue);
        setOptionsSearchQuery("");
        setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: ["metadata-values", metadataKey] as const });
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
          autoFocus={autoFocus}
          type="button"
          variant="outline"
          className={cn("flex-1 justify-between text-start", className)}
        >
          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              value || placeholder || `Select metadata value...`
            )}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search for or add a value..."
            value={optionsSearchQuery}
            onValueChange={setOptionsSearchQuery}
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
            <CommandGroup>
              {options.map((option, idx) => (
                <CommandItem
                  key={`${option}-${idx}`}
                  value={option}
                  onSelect={() => {
                    onValueChange(option);
                    setOptionsSearchQuery("");
                    setIsOpen(false);
                  }}
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const getMetadataValues = async (
  fetcher: typeof fetch,
  metadataKey: string,
  viewContext: ViewContext
): Promise<string[]> => {
  return await fetcher(`/assets/metadata-values/${metadataKey}`, {
    headers: {
      "x-view-context": viewContext,
    },
  }).then((r) => r.json() as Promise<string[]>);
};
