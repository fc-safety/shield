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
  selectedProductId,
  onProductIdChange,
}: {
  parentProductId?: string;
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  selectedProductId?: string;
  onProductIdChange?: (productId: string | undefined) => void;
}) {
  const consumableFetcher = useFetcher<ResultsPage<Product>>();
  const productFetcher = useFetcher<ResultsPage<Product>>();

  const [consumableProducts, setConsumableProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [consumableSearch, setConsumableSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Get the effective parent product ID (either from props or selected)
  const effectiveParentProductId = parentProductId || selectedProductId;

  const preloadConsumableProducts = useCallback(() => {
    if (effectiveParentProductId && consumableFetcher.state === "idle" && !consumableFetcher.data) {
      consumableFetcher.load(`/api/proxy/products?parentProduct[id]=${effectiveParentProductId}`);
    }
  }, [consumableFetcher, effectiveParentProductId]);

  const preloadAllProducts = useCallback(() => {
    if (!parentProductId && productFetcher.state === "idle" && !productFetcher.data) {
      productFetcher.load("/api/proxy/products?type=PRIMARY&limit=10000");
    }
  }, [productFetcher, parentProductId]);

  useEffect(() => {
    if (value && effectiveParentProductId) preloadConsumableProducts();
  }, [value, effectiveParentProductId, preloadConsumableProducts]);

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

  // If no parentProductId provided, show product selector first
  if (!parentProductId && !selectedProductId) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-sm text-muted-foreground">First, select a product:</div>
        <ResponsiveCombobox
          value={selectedProductId}
          onValueChange={onProductIdChange}
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
    );
  }

  // If we have a selected product but no parentProductId, show both selectors
  if (!parentProductId && selectedProductId) {
    return (
      <div className={cn("space-y-2", className)}>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Product:</div>
          <ResponsiveCombobox
            value={selectedProductId}
            onValueChange={(value) => {
              onProductIdChange?.(value);
              // Clear consumable selection when product changes
              if (value !== selectedProductId) {
                onValueChange?.(undefined);
              }
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
        <div>
          <div className="text-sm text-muted-foreground mb-1">Consumable:</div>
          <ResponsiveCombobox
            value={value}
            onValueChange={onValueChange}
            onBlur={onBlur}
            displayValue={(value) => consumableProducts.find((p) => p.id === value)?.name ?? <>&mdash;</>}
            loading={consumableFetcher.state === "loading"}
            options={consumableOptions}
            disabled={disabled}
            onMouseOver={() => !disabled && preloadConsumableProducts()}
            onTouchStart={() => !disabled && preloadConsumableProducts()}
            searchValue={consumableSearch}
            onSearchValueChange={setConsumableSearch}
            placeholder="Select a consumable..."
            shouldFilter={false}
            showClear
          />
        </div>
      </div>
    );
  }

  // If we have an effective parent product ID, show consumable selector
  if (!effectiveParentProductId) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        No product selected
      </div>
    );
  }

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) => consumableProducts.find((p) => p.id === value)?.name ?? <>&mdash;</>}
      loading={consumableFetcher.state === "loading"}
      options={consumableOptions}
      disabled={disabled}
      onMouseOver={() => !disabled && preloadConsumableProducts()}
      onTouchStart={() => !disabled && preloadConsumableProducts()}
      searchValue={consumableSearch}
      onSearchValueChange={setConsumableSearch}
      className={className}
      placeholder="Select a consumable..."
      shouldFilter={false}
      showClear
    />
  );
}
