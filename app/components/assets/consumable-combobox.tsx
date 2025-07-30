import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { ResponsiveCombobox } from "~/components/responsive-combobox";
import type { Product, ResultsPage } from "~/lib/models";
import { cn } from "~/lib/utils";

const consumableSelectFuse = new Fuse([] as Product[], { keys: ["name"] });
const productSelectFuse = new Fuse([] as Product[], { keys: ["name"] });
export default function ConsumableCombobox({
  parentProductId,
  value,
  onValueChange,
  onBlur,
  className,
  disabled,
}: {
  parentProductId?: string;
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const consumableFetcher = useFetcher<ResultsPage<Product>>();
  const productFetcher = useFetcher<ResultsPage<Product>>();

  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [consumableProducts, setConsumableProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [consumableSearch, setConsumableSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Get the effective parent product ID (either from props or selected)
  const effectiveParentProductId = parentProductId || selectedProductId;

  const preloadConsumableProducts = useCallback(
    (parentId: string) => {
      if (consumableFetcher.state === "idle") {
        consumableFetcher.load(`/api/proxy/products?parentProduct[id]=${parentId}`);
      }
    },
    [consumableFetcher.state, consumableFetcher.load]
  );

  const preloadAllProducts = useCallback(() => {
    if (!parentProductId && productFetcher.state === "idle" && !productFetcher.data) {
      productFetcher.load("/api/proxy/products?type=PRIMARY&limit=10000");
    }
  }, [productFetcher, parentProductId]);

  useEffect(() => {
    if (value && effectiveParentProductId && !consumableFetcher.data)
      preloadConsumableProducts(effectiveParentProductId);
  }, [value, effectiveParentProductId, preloadConsumableProducts, consumableFetcher.data]);

  useEffect(() => {
    if (!parentProductId) preloadAllProducts();
  }, [parentProductId, preloadAllProducts]);

  useEffect(() => {
    if (consumableFetcher.data) {
      setConsumableProducts(consumableFetcher.data.results);
    }
  }, [consumableFetcher.data]);

  useEffect(() => {
    if (productFetcher.data) {
      setAllProducts(productFetcher.data.results);
    }
  }, [productFetcher.data]);

  const consumableOptions = useMemo(() => {
    let filteredProducts = consumableProducts;
    if (consumableSearch) {
      consumableSelectFuse.setCollection(consumableProducts);
      filteredProducts = consumableSelectFuse.search(consumableSearch).map((result) => result.item);
    }
    return filteredProducts.map((p) => ({
      label: p.name,
      value: p.id,
    }));
  }, [consumableProducts, consumableSearch]);

  const productOptions = useMemo(() => {
    let filteredProducts = allProducts;
    if (productSearch) {
      productSelectFuse.setCollection(allProducts);
      filteredProducts = productSelectFuse.search(productSearch).map((result) => result.item);
    }
    return filteredProducts.map((p) => ({
      label: p.name,
      value: p.id,
    }));
  }, [allProducts, productSearch]);

  // If we have a selected product but no parentProductId, show both selectors
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!parentProductId && (
        <div className="flex items-center gap-1">
          <div className="text-muted-foreground text-sm">First, select a product:</div>
          <ResponsiveCombobox
            value={selectedProductId}
            onValueChange={(value) => {
              // Clear consumable selection when product changes
              if (value !== selectedProductId) {
                onValueChange?.(undefined);
              }
              setSelectedProductId(value);
              if (value) preloadConsumableProducts(value);
            }}
            onBlur={onBlur}
            displayValue={(value) => allProducts.find((p) => p.id === value)?.name ?? <>&mdash;</>}
            loading={productFetcher.state === "loading"}
            options={productOptions}
            disabled={disabled}
            onMouseOver={() => !disabled && preloadAllProducts()}
            onTouchStart={() => !disabled && preloadAllProducts()}
            searchValue={productSearch}
            onSearchValueChange={setProductSearch}
            placeholder="Select a product..."
            shouldFilter={false}
            showClear
          />
        </div>
      )}
      {effectiveParentProductId && (
        <div className="flex items-center gap-1">
          {!parentProductId && (
            <div className="text-muted-foreground mb-1 text-sm">Then, select a supply:</div>
          )}
          <ResponsiveCombobox
            value={value}
            onValueChange={onValueChange}
            onBlur={onBlur}
            displayValue={(value) =>
              consumableProducts.find((p) => p.id === value)?.name ?? <>&mdash;</>
            }
            loading={consumableFetcher.state === "loading"}
            options={consumableOptions}
            disabled={disabled}
            onMouseOver={() => !disabled && preloadConsumableProducts(effectiveParentProductId)}
            onTouchStart={() => !disabled && preloadConsumableProducts(effectiveParentProductId)}
            searchValue={consumableSearch}
            onSearchValueChange={setConsumableSearch}
            placeholder="Select a supply..."
            shouldFilter={false}
            showClear
          />
        </div>
      )}
    </div>
  );
}
