import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogClose } from "@radix-ui/react-dialog";
import { Link2, Loader2, Pencil, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { Manufacturer, ResultsPage } from "~/lib/models";
import { cn } from "~/lib/utils";
import LinkPreview from "../link-preview";
import CustomTag from "./custom-tag";

interface ManufacturerSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ManufacturerSelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
}: ManufacturerSelectorProps) {
  const opened = useRef(false);
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const fetcher = useFetcher<ResultsPage<Manufacturer>>();

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  const defaultManufacturer = useMemo(
    () => manufacturers.find((c) => c.id === value),
    [manufacturers, value]
  );

  // Trigger onBlur when the dialog is closed.
  useEffect(() => {
    if (opened.current && !open) {
      onBlur?.();
    }

    if (open) {
      opened.current = true;
    }
  }, [open, onBlur]);

  // Preload the manufacturers lazily.
  const handlePreload = useCallback(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      fetcher.load("/api/manufacturers");
    }
  }, [fetcher]);

  // Set the manufacturers when they are loaded from the fetcher.
  useEffect(() => {
    if (fetcher.data) {
      setManufacturers(fetcher.data.results);
    }
  }, [fetcher.data]);

  // Preload the product manufacturers when a value is set.
  useEffect(() => {
    if (value) {
      handlePreload();
    }
  }, [value, handlePreload]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {value ? (
        <ManufacturerCard
          manufacturer={defaultManufacturer}
          renderEditButton={() => (
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
              >
                <Pencil />
              </Button>
            </DialogTrigger>
          )}
        />
      ) : (
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            className={cn(className)}
            onMouseEnter={handlePreload}
          >
            <Search />
            Select Manufacturer
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="px-0">
        <DialogHeader className="px-6">
          <DialogTitle>Find Manufacturer</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 border-b border-t px-6 self-stretch">
          <RadioGroup
            defaultValue="card"
            className="grid grid-cols-2 gap-4 py-2"
            onValueChange={setTempValue}
            value={tempValue ?? ""}
          >
            {manufacturers
              .filter((m) => m.active || m.id === value)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((manufacturer) => (
                <div key={manufacturer.id}>
                  <RadioGroupItem
                    value={manufacturer.id}
                    id={manufacturer.id}
                    className="peer sr-only"
                    disabled={!manufacturer.active}
                  />
                  <Label
                    htmlFor={manufacturer.id}
                    className="font-semibold h-full flex flex-col gap-2 items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    {manufacturer.name}
                  </Label>
                </div>
              ))}
          </RadioGroup>
        </ScrollArea>
        <div className="flex justify-end gap-2 px-6">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              if (tempValue) {
                onValueChange?.(tempValue);
              }
              setOpen(false);
            }}
            disabled={tempValue === undefined}
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ManufacturerCardProps {
  manufacturer: Manufacturer | undefined;
  renderEditButton?: () => React.ReactNode;
}

export function ManufacturerCard({
  manufacturer,
  renderEditButton,
}: ManufacturerCardProps) {
  return (
    <Card>
      {manufacturer ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {manufacturer?.name}
              {manufacturer.homeUrl && (
                <LinkPreview url={manufacturer.homeUrl}>
                  <Button size="icon" variant="ghost" type="button">
                    <Link2 />
                  </Button>
                </LinkPreview>
              )}
              {manufacturer.client && <CustomTag />}
              <div className="flex-1"></div>
              {renderEditButton?.()}
            </CardTitle>
          </CardHeader>
        </>
      ) : (
        <CardHeader>
          <CardTitle>
            <Loader2 className="animate-spin" />
          </CardTitle>
        </CardHeader>
      )}
    </Card>
  );
}
