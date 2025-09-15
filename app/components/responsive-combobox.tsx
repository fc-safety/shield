import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerNested,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import { cn } from "~/lib/utils";

interface ResponsiveComboboxProps extends Omit<SelectOptionsProps, "setOpen" | "onSelected"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  displayValue?: (value: string) => ReactNode;
  placeholder?: string;
  onMouseOver?: ComponentProps<"button">["onMouseOver"];
  onTouchStart?: ComponentProps<"button">["onTouchStart"];
  onKeyDown?: ComponentProps<"button">["onKeyDown"];
  className?: string;
  showClear?: boolean;
  disabled?: boolean;
  compactClearButton?: boolean;
  isNestedDrawer?: boolean;
}

export function ResponsiveCombobox({
  open: openProp,
  onOpenChange,
  value: valueProp,
  onValueChange,
  displayValue,
  placeholder,
  onMouseOver,
  onTouchStart,
  onKeyDown,
  onBlur,
  className,
  showClear = false,
  disabled,
  compactClearButton = false,
  isNestedDrawer = false,
  ...selectOptionsProps
}: ResponsiveComboboxProps) {
  const [internalOpen, setInternalOpen] = useState(openProp ?? false);
  const open = openProp ?? internalOpen;
  const setOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };
  const isDesktop = useMediaQuery("(min-width: 768px)");
  useBlurOnClose({
    onBlur,
    open,
  });

  const [internalValue, setInternalValue] = useState(valueProp ?? undefined);
  const value = valueProp ?? internalValue;
  const setValue = (value: string | undefined) => {
    setInternalValue(value);
    onValueChange?.(value);
  };
  useEffect(() => {
    setInternalValue(valueProp);
  }, [valueProp]);

  const renderInput = ({ renderTrigger }: { renderTrigger: (trigger: ReactNode) => ReactNode }) => (
    <div
      className={cn(
        "flex items-center gap-2",
        compactClearButton && "flex-col items-start gap-0.5",
        className
      )}
    >
      {renderTrigger(
        <Button
          type="button"
          variant="outline"
          className={cn(
            "flex-1 justify-between text-start",
            compactClearButton && "w-full",
            className
          )}
          onMouseOver={onMouseOver}
          onTouchStart={onTouchStart}
          onKeyDown={onKeyDown}
          disabled={disabled}
        >
          <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {value ? (
              <>{displayValue ? displayValue(value) : value}</>
            ) : (
              <>{placeholder ?? "Select"}</>
            )}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      )}
      {showClear && value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setValue(undefined)}
          className={cn(compactClearButton && "h-5 self-end px-1 py-0.5 text-xs")}
        >
          Clear
        </Button>
      )}
    </div>
  );

  const renderContent = () => (
    <SelectOptions setOpen={setOpen} onSelected={setValue} {...selectOptionsProps} />
  );

  if (isDesktop) {
    return (
      <AsPopover
        open={open}
        setOpen={setOpen}
        renderInput={renderInput}
        renderContent={renderContent}
      />
    );
  }

  return (
    <AsDrawer
      open={open}
      setOpen={setOpen}
      renderInput={renderInput}
      renderContent={renderContent}
      isNestedDrawer={isNestedDrawer}
    />
  );
}

interface BoxTypeProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  renderInput: (opts: { renderTrigger: (trigger: ReactNode) => ReactNode }) => ReactNode;
  renderContent: () => ReactNode;
}

function AsPopover({ open, setOpen, renderInput, renderContent }: BoxTypeProps) {
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      {renderInput({
        renderTrigger: (trigger) => <PopoverTrigger asChild>{trigger}</PopoverTrigger>,
      })}
      <PopoverContent className="w-[300px] p-0" align="start">
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
}

function AsDrawer({
  open,
  setOpen,
  renderInput,
  renderContent,
  isNestedDrawer,
}: BoxTypeProps & { isNestedDrawer: boolean }) {
  const DrawerComponent = isNestedDrawer ? DrawerNested : Drawer;
  return (
    <DrawerComponent open={open} onOpenChange={setOpen}>
      {renderInput({
        renderTrigger: (trigger) => <DrawerTrigger asChild>{trigger}</DrawerTrigger>,
      })}
      <DrawerContent className="min-h-[calc(100dvh/2)]">
        <DrawerTitle className="sr-only">Select</DrawerTitle>
        <DrawerDescription className="sr-only">Select an option from the list.</DrawerDescription>
        <div className="mt-4 border-t pb-4">{renderContent()}</div>
      </DrawerContent>
    </DrawerComponent>
  );
}

interface ComboboxOption {
  value: string;
  label: ReactNode;
}

interface ComboboxOptionGroup {
  key: string;
  groupLabel: ReactNode;
  options: ComboboxOption[];
}

interface SelectOptionsProps {
  setOpen: (open: boolean) => void;
  onSelected: (status: string) => void;
  options: ComboboxOption[] | ComboboxOptionGroup[];
  searchPlaceholder?: string;
  noResultsText?: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  loading?: boolean;
  shouldFilter?: boolean;
  errorMessage?: string;
  onCreate?: () => void;
}

function SelectOptions({
  setOpen,
  onSelected: onSelected,
  options: optionsOrOptionGroups,
  searchPlaceholder = "Filter...",
  noResultsText = "No results found.",
  searchValue = "",
  onSearchValueChange = () => {},
  loading = false,
  shouldFilter = true,
  errorMessage,
  onCreate,
}: SelectOptionsProps) {
  const options = useMemo(() => {
    const firstEl = optionsOrOptionGroups.at(0);
    if (firstEl === undefined) return [] as ComboboxOption[];
    if ("groupLabel" in firstEl) {
      return null;
    }
    return optionsOrOptionGroups as ComboboxOption[];
  }, [optionsOrOptionGroups]);

  const optionGroups = useMemo(() => {
    const firstEl = optionsOrOptionGroups.at(0);
    if (firstEl === undefined) return null;
    if ("groupLabel" in firstEl) {
      return optionsOrOptionGroups as ComboboxOptionGroup[];
    }
    return null;
  }, [optionsOrOptionGroups]);

  return (
    <Command shouldFilter={shouldFilter}>
      <CommandInput
        placeholder={searchPlaceholder}
        value={searchValue}
        onValueChange={onSearchValueChange}
      />
      <CommandList>
        <CommandEmpty>{noResultsText}</CommandEmpty>
        {(onCreate || loading || (options && options.length === 0 && errorMessage)) && (
          <CommandGroup>
            {onCreate && (
              <CommandItem onSelect={onCreate}>
                <Plus />
                Create New
              </CommandItem>
            )}
            {loading ? (
              <CommandItem disabled>
                <Loader2 className="animate-spin" />
              </CommandItem>
            ) : options && options.length === 0 && errorMessage ? (
              <CommandItem disabled className="text-xs italic">
                {errorMessage}
              </CommandItem>
            ) : null}
          </CommandGroup>
        )}

        {optionGroups ? (
          optionGroups.map((group) => (
            <CommandGroup key={group.key} heading={group.groupLabel}>
              {group.options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(value) => {
                    onSelected(value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        ) : options ? (
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(value) => {
                  onSelected(value);
                  setOpen(false);
                }}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}
