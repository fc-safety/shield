import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useMediaQuery } from "usehooks-ts";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import { cn } from "~/lib/utils";

interface ResponsiveComboboxProps
  extends Omit<SelectOptionsProps, "setOpen" | "onSelected"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  displayValue?: (value: string) => ReactNode;
  placeholder?: string;
  onMouseOver?: ComponentProps<"button">["onMouseOver"];
  className?: string;
  showClear?: boolean;
  disabled?: boolean;
}

export function ResponsiveCombobox({
  open: openProp,
  onOpenChange,
  value: valueProp,
  onValueChange,
  displayValue,
  placeholder,
  onMouseOver,
  onBlur,
  className,
  showClear = false,
  disabled,
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

  const renderInput = ({
    renderTrigger,
  }: {
    renderTrigger: (trigger: ReactNode) => ReactNode;
  }) => (
    <div className="flex items-center gap-2">
      {renderTrigger(
        <Button
          type="button"
          variant="outline"
          className={cn("w-[150px] justify-between", className)}
          onMouseOver={onMouseOver}
          disabled={disabled}
        >
          {value ? (
            <>{displayValue ? displayValue(value) : value}</>
          ) : (
            <>{placeholder ?? "Select"}</>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      )}
      {showClear && value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setValue(undefined)}
        >
          Clear
        </Button>
      )}
    </div>
  );

  const renderContent = () => (
    <SelectOptions
      setOpen={setOpen}
      onSelected={setValue}
      {...selectOptionsProps}
    />
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
    />
  );
}

interface BoxTypeProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  renderInput: (opts: {
    renderTrigger: (trigger: ReactNode) => ReactNode;
  }) => ReactNode;
  renderContent: () => ReactNode;
}

function AsPopover({
  open,
  setOpen,
  renderInput,
  renderContent,
}: BoxTypeProps) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {renderInput({
        renderTrigger: (trigger) => (
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        ),
      })}
      <PopoverContent className="w-[300px] p-0" align="start">
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
}

function AsDrawer({ open, setOpen, renderInput, renderContent }: BoxTypeProps) {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {renderInput({
        renderTrigger: (trigger) => (
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        ),
      })}
      <DrawerContent>
        <div className="mt-4 pb-4 border-t">{renderContent()}</div>
      </DrawerContent>
    </Drawer>
  );
}

interface SelectOptionsProps {
  setOpen: (open: boolean) => void;
  onSelected: (status: string) => void;
  options: {
    value: string;
    label: ReactNode;
  }[];
  searchPlaceholder?: string;
  noResultsText?: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  loading?: boolean;
  shouldFilter?: boolean;
}

function SelectOptions({
  setOpen,
  onSelected: onSelected,
  options,
  searchPlaceholder = "Filter...",
  noResultsText = "No results found.",
  searchValue = "",
  onSearchValueChange = () => {},
  loading = false,
  shouldFilter = true,
}: SelectOptionsProps) {
  return (
    <Command shouldFilter={shouldFilter}>
      <CommandInput
        placeholder={searchPlaceholder}
        value={searchValue}
        onValueChange={onSearchValueChange}
      />
      <CommandList>
        <CommandEmpty>{noResultsText}</CommandEmpty>
        <CommandGroup>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            options.map((option) => (
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
            ))
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
