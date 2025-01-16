import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Pencil, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ProductCategory, ResultsPage } from "~/lib/models";
import { cn } from "~/lib/utils";
import Icon from "../icons/icon";

interface ProductCategorySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ProductCategorySelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
}: ProductCategorySelectorProps) {
  const opened = useRef(false);
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const fetcher = useFetcher<ResultsPage<ProductCategory>>();

  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const defaultCategory = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value]
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

  // Preload the product categories lazily.
  const handlePreload = useCallback(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      fetcher.load("/api/product-categories");
    }
  }, [fetcher]);

  // Set the categories when they are loaded from the fetcher.
  useEffect(() => {
    if (fetcher.data) {
      setCategories(fetcher.data.results);
    }
  }, [fetcher.data]);

  // Preload the product categories when a value is set.
  useEffect(() => {
    if (value) {
      handlePreload();
    }
  }, [value, handlePreload]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {value ? (
        <ProductCategoryCard
          productCategory={defaultCategory}
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
            Select Category
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="px-0">
        <DialogHeader className="px-6">
          <DialogTitle>Find Category</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 border-b border-t px-6 self-stretch">
          <RadioGroup
            defaultValue="card"
            className="grid grid-cols-2 gap-4 py-2"
            onValueChange={setTempValue}
            value={tempValue ?? ""}
          >
            {categories
              .filter((c) => c.active || c.id === value)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((productCategory) => (
                <div key={productCategory.id}>
                  <RadioGroupItem
                    value={productCategory.id}
                    id={productCategory.id}
                    className="peer sr-only"
                    disabled={!productCategory.active}
                  />
                  <Label
                    htmlFor={productCategory.id}
                    className="font-semibold h-full flex flex-col gap-2 items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex gap-2 items-center">
                      {productCategory.icon && (
                        <Icon
                          iconId={productCategory.icon}
                          color={productCategory.color}
                          className="text-lg"
                        />
                      )}
                      {productCategory.shortName && (
                        <span className="uppercase">
                          {productCategory.shortName}
                        </span>
                      )}
                    </div>
                    <span className="font-regular text-xs text-center">
                      {productCategory.name}
                    </span>
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

interface ProductCategoryCardProps {
  productCategory: ProductCategory | undefined;
  renderEditButton?: () => React.ReactNode;
}

function ProductCategoryCard({
  productCategory,
  renderEditButton,
}: ProductCategoryCardProps) {
  return (
    <Card>
      {productCategory ? (
        <>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="grid gap-2">
                <div className="flex gap-2 items-center">
                  {productCategory.icon && (
                    <Icon
                      iconId={productCategory.icon}
                      color={productCategory.color}
                      className="text-lg"
                    />
                  )}
                  {productCategory?.name}
                </div>
                <span className="text-xs text-muted-foreground">
                  {productCategory?.description || <>&mdash;</>}
                </span>
              </div>
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
