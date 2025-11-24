import Fuse from "fuse.js";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataOrError } from "~/.server/api-utils";
import { ResponsiveCombobox } from "~/components/responsive-combobox";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Product, ResultsPage } from "~/lib/models";

const productSelectFuse = new Fuse([] as Product[], { keys: ["name", "consumableProducts.name"] });
export default function ConsumableCombobox({
  parentProductId,
  value,
  onValueChange,
  onBlur,
  className,
  disabled,
  compactClearButton,
}: {
  parentProductId?: string;
  value?: string | undefined;
  onValueChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  compactClearButton?: boolean;
}) {
  const {
    load,
    data: dataOrError,
    isLoading,
  } = useModalFetcher<DataOrError<ResultsPage<Product>>>();

  const [consumableProducts, setConsumableProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const preloadConsumableProducts = useCallback(
    (parentId?: string) => {
      if (!dataOrError) {
        load({
          path: "/api/proxy/products",
          query: {
            limit: 1000,
            type: "CONSUMABLE",
            include: {
              parentProduct: true,
            },
            parentProductId: parentId
              ? parentId
              : {
                  not: "_NULL",
                },
          },
        });
      }
    },
    [dataOrError, load]
  );

  useEffect(() => {
    if (value) preloadConsumableProducts(parentProductId);
  }, [parentProductId, preloadConsumableProducts, value]);

  useEffect(() => {
    if (dataOrError?.data) {
      setConsumableProducts(dataOrError.data.results);
    }
  }, [dataOrError]);

  const productOptionGroups = useMemo(() => {
    let filteredProducts = consumableProducts;
    if (productSearch) {
      productSelectFuse.setCollection(consumableProducts);
      filteredProducts = productSelectFuse.search(productSearch).map((result) => result.item);
    }

    if (parentProductId) {
      return filteredProducts.map((p) => ({
        label: p.name,
        value: p.id,
      }));
    }

    const groupedConsumableProducts = filteredProducts
      .sort((a, b) => {
        if (a.parentProduct && b.parentProduct && a.parentProduct.name !== b.parentProduct.name) {
          return a.parentProduct.name.localeCompare(b.parentProduct.name);
        }
        return a.name.localeCompare(b.name);
      })
      .reduce((acc, p) => {
        if (!p.parentProduct) return acc;
        if (acc.has(p.parentProduct.id)) {
          acc.get(p.parentProduct.id)?.consumableProducts.push(p);
        } else {
          acc.set(p.parentProduct.id, { parentProduct: p.parentProduct, consumableProducts: [p] });
        }
        return acc;
      }, new Map<string, { parentProduct: Product; consumableProducts: Product[] }>());

    return Array.from(groupedConsumableProducts.values()).map((group) => ({
      key: group.parentProduct.id,
      groupLabel: group.parentProduct.name,
      options: group.consumableProducts.map((cp) => ({
        label: cp.name,
        value: cp.id,
      })),
    }));
  }, [consumableProducts, productSearch]);

  return (
    <>
      <ResponsiveCombobox
        value={value}
        onValueChange={onValueChange}
        onBlur={onBlur}
        displayValue={(value) => {
          const p = consumableProducts.find((p) => p.id === value);
          if (!p) return <>&mdash;</>;
          return (
            <div className="flex items-center gap-1">
              {p.parentProduct?.name}
              <ChevronRight className="size-3" />
              {p.name}
            </div>
          );
        }}
        loading={isLoading}
        options={productOptionGroups}
        disabled={disabled}
        onMouseOver={() => !disabled && preloadConsumableProducts(parentProductId)}
        onTouchStart={() => !disabled && preloadConsumableProducts(parentProductId)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) {
            preloadConsumableProducts(parentProductId);
          }
        }}
        searchValue={productSearch}
        onSearchValueChange={setProductSearch}
        placeholder="Select a supply..."
        shouldFilter={false}
        showClear
        className={className}
        compactClearButton={compactClearButton}
      />
    </>
  );
}
