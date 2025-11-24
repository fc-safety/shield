import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Pencil, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataOrError, ViewContext } from "~/.server/api-utils";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { ProductCategory, ResultsPage } from "~/lib/models";
import type { QueryParams } from "~/lib/urls";
import { cn } from "~/lib/utils";
import Icon from "../icons/icon";
import { ResponsiveDialog } from "../responsive-dialog";
import { Badge } from "../ui/badge";
import CustomTag from "./custom-tag";

interface ProductCategorySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  viewContext?: ViewContext;
  clientId?: string;
}

export default function ProductCategorySelector({
  value,
  onValueChange,
  onBlur,
  disabled,
  className,
  viewContext,
  clientId,
}: ProductCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const { load, data: dataOrError } = useModalFetcher<DataOrError<ResultsPage<ProductCategory>>>({
    onData: (data) => {
      if (data.data) {
        setCategories(data.data.results);
      }
    },
  });

  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const defaultCategory = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value]
  );

  useBlurOnClose({
    onBlur,
    open,
  });

  // Preload the product categories lazily.
  const handlePreload = useCallback(() => {
    if (dataOrError === undefined) {
      let clientQuery: QueryParams = {};
      if (clientId) {
        clientQuery.OR = [{ clientId }, { clientId: "_NULL" }];
      } else if (viewContext === "admin") {
        clientQuery.clientId = "_NULL";
      }

      load({
        path: "/api/proxy/product-categories",
        query: {
          limit: 1000,
          ...clientQuery,
        },
        viewContext,
      });
    }
  }, [dataOrError, load, viewContext, clientId]);

  // Preload the product categories when a value is set.
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
          <ProductCategoryCard
            productCategory={defaultCategory}
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
              Select Category
            </Button>
          </DialogTrigger>
        )
      }
      render={() => (
        <>
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
                    className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex h-full flex-col items-center justify-center gap-2 rounded-md border-2 p-4 font-semibold"
                  >
                    {productCategory.clientId && <CustomTag />}
                    <div className="flex items-center gap-2">
                      {productCategory.icon && (
                        <Icon
                          iconId={productCategory.icon}
                          color={productCategory.color}
                          className="text-lg"
                        />
                      )}
                      {productCategory.shortName && (
                        <span className="uppercase">{productCategory.shortName}</span>
                      )}
                    </div>
                    <span className="font-regular text-center text-xs">{productCategory.name}</span>
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
              disabled={tempValue === undefined}
            >
              Select
            </Button>
          </div>
        </>
      )}
    />
  );
}

interface ProductCategoryCardProps {
  productCategory: ProductCategory | undefined;
  renderEditButton?: () => React.ReactNode;
  className?: string;
}

export function ProductCategoryCard({
  productCategory,
  renderEditButton,
  className,
}: ProductCategoryCardProps) {
  return (
    <Card className={className}>
      {productCategory ? (
        <>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {productCategory.icon && (
                    <Icon
                      iconId={productCategory.icon}
                      color={productCategory.color}
                      className="text-lg"
                    />
                  )}
                  <span className="min-w-min flex-1">{productCategory?.name}</span>
                  {productCategory.shortName && (
                    <Badge className={cn("w-max text-sm uppercase")} variant="secondary">
                      {productCategory.shortName}
                    </Badge>
                  )}
                  {productCategory.clientId && <CustomTag />}
                </div>
                <span className="text-muted-foreground text-xs">
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
