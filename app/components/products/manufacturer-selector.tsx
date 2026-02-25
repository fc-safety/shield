import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link2, Loader2, Pencil, Search, SearchX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { useAccessIntent } from "~/contexts/requested-access-context";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Manufacturer, ResultsPage } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { cn } from "~/lib/utils";
import LinkPreview from "../link-preview";
import { ResponsiveDialog } from "../responsive-dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import CustomTag from "./custom-tag";

interface ManufacturerSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  clientId?: string;
}

export default function ManufacturerSelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
  clientId,
}: ManufacturerSelectorProps) {
  const accessIntent = useAccessIntent();
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const {
    load,
    data: dataOrError,
    isLoading,
  } = useModalFetcher<DataOrError<ResultsPage<Manufacturer>>>({
    onData: (data) => {
      if (data.data) {
        setManufacturers(data.data.results);
      }
    },
  });

  const defaultManufacturer = useMemo(
    () => manufacturers.find((c) => c.id === value),
    [manufacturers, value]
  );

  useBlurOnClose({
    onBlur,
    open,
  });

  // Preload the manufacturers lazily.
  const handlePreload = useCallback(() => {
    if (dataOrError === undefined) {
      let clientQuery: QueryParams = {};
      if (clientId) {
        clientQuery.OR = [{ clientId }, { clientId: "_NULL" }];
      } else if (accessIntent !== "user") {
        clientQuery.clientId = "_NULL";
      }

      load({
        path: "/api/proxy/manufacturers",
        query: { limit: 1000, ...clientQuery },
        accessIntent,
      });
    }
  }, [dataOrError, load, accessIntent, clientId]);

  // Preload the product manufacturers when a value is set.
  useEffect(() => {
    if (value) {
      handlePreload();
    }
  }, [value, handlePreload]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      dialogClassName="sm:max-w-2xl"
      trigger={
        value ? (
          <ManufacturerCard
            manufacturer={defaultManufacturer}
            renderEditButton={() => (
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" disabled={disabled}>
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
              onTouchStart={handlePreload}
            >
              <Search />
              Select Manufacturer
            </Button>
          </DialogTrigger>
        )
      }
      title="Find Manufacturer"
      render={() => (
        <>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : manufacturers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No manufacturers found.</EmptyTitle>
                <EmptyDescription>
                  There are no manufacturers available for you to select for this product.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
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
                    className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex h-full flex-col items-center justify-center gap-2 rounded-md border-2 p-4 font-semibold"
                  >
                    {manufacturer.clientId && <CustomTag />}
                    {manufacturer.name}
                  </Label>
                </div>
              ))}
          </RadioGroup>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (tempValue) {
                  onValueChange?.(tempValue);
                }
                setOpen(false);
              }}
              disabled={!tempValue}
            >
              Select
            </Button>
          </div>
        </>
      )}
    ></ResponsiveDialog>
  );
}

interface ManufacturerCardProps {
  manufacturer: Manufacturer | undefined;
  renderEditButton?: () => React.ReactNode;
  className?: string;
}

export function ManufacturerCard({
  manufacturer,
  renderEditButton,
  className,
}: ManufacturerCardProps) {
  return (
    <Card className={className}>
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
              {manufacturer.clientId && <CustomTag />}
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
