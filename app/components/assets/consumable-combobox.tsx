import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { ResponsiveCombobox } from "~/components/responsive-combobox";
import type { Product, ResultsPage } from "~/lib/models";

const consumableSelectFuse = new Fuse([] as Product[], { keys: ["name"] });
export default function ConsumableCombobox({
  parentProductId,
  assetId,
  value,
  onValueChange,
  onBlur,
  className,
  disabled,
}: {
  parentProductId: string;
  assetId?: string;
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const fetcher = useFetcher<ResultsPage<Product>>();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const preloadProducts = useCallback(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(
        `/api/proxy/products?parentProduct[id]=${parentProductId}&limit=1000${
          assetId ? `&consumables[none][asset][id]=${assetId}` : ""
        }`
      );
    }
  }, [fetcher, parentProductId, assetId]);

  useEffect(() => {
    if (value) preloadProducts();
  }, [value, preloadProducts]);

  useEffect(() => {
    if (fetcher.data) {
      setProducts(fetcher.data.results);
    }
  }, [fetcher.data]);

  const options = useMemo(() => {
    let filteredProducts = products;
    if (search) {
      consumableSelectFuse.setCollection(products);
      filteredProducts = consumableSelectFuse
        .search(search)
        .map((result) => result.item);
    }
    return filteredProducts.map((p) => ({
      label: p.name,
      value: p.id,
    }));
  }, [products, search]);

  return (
    <ResponsiveCombobox
      value={value}
      onValueChange={onValueChange}
      onBlur={onBlur}
      displayValue={(value) =>
        products.find((p) => p.id === value)?.name ?? <>&mdash;</>
      }
      loading={fetcher.state === "loading"}
      options={options}
      disabled={disabled}
      onMouseOver={() => !disabled && preloadProducts()}
      searchValue={search}
      onSearchValueChange={setSearch}
      className={className}
      shouldFilter={false}
      showClear
    />
  );
}
