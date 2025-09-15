import type { QueryOptions } from "@tanstack/react-query";
import type { Product, ResultsPage } from "~/lib/models";
import { buildPath } from "~/lib/urls";
import { dedupById } from "~/lib/utils";

export const getProductsFn = async (
  fetcher: typeof fetch,
  options: {
    productCategoryId?: string;
    manufacturerId?: string;
  } = {}
) => {
  const products = await fetcher(
    buildPath("/products", {
      limit: 1000,
      type: "PRIMARY",
      productCategory: options.productCategoryId ? { id: options.productCategoryId } : undefined,
      manufacturer: options.manufacturerId ? { id: options.manufacturerId } : undefined,
    })
  );
  const result = (await products.json()) as ResultsPage<Product>;
  return result.results;
};

export const getProductsQuery = (
  fetcher: typeof fetch,
  options?: Parameters<typeof getProductsFn>[1]
) =>
  ({
    queryFn: () => getProductsFn(fetcher, options),
    queryKey: ["primary-products", options],
  }) satisfies QueryOptions;

export const getCategoriesByProductFn = async (
  fetcher: typeof fetch,
  options?: Parameters<typeof getProductsFn>[1]
) => {
  return getProductsFn(fetcher, options)
    .then((products) => dedupById(products.map((p) => p.productCategory)))
    .then((categories) =>
      categories.sort((a, b) => (a.shortName ?? a.name).localeCompare(b.shortName ?? b.name))
    );
};

export const getCategoriesByProductQuery = (
  fetcher: typeof fetch,
  options?: Parameters<typeof getCategoriesByProductFn>[1]
) =>
  ({
    queryFn: () => getCategoriesByProductFn(fetcher, options),
    queryKey: ["categories-by-product", options],
  }) satisfies QueryOptions;

export const getManufacturersByProductFn = async (
  fetcher: typeof fetch,
  options?: Parameters<typeof getProductsFn>[1]
) => {
  return getProductsFn(fetcher, options)
    .then((products) => dedupById(products.map((p) => p.manufacturer)))
    .then((manufacturers) => manufacturers.sort((a, b) => a.name.localeCompare(b.name)));
};

export const getManufacturersByProductQuery = (
  fetcher: typeof fetch,
  options?: Parameters<typeof getManufacturersByProductFn>[1]
) =>
  ({
    queryFn: () => getManufacturersByProductFn(fetcher, options),
    queryKey: ["manufacturers-by-product", options],
  }) satisfies QueryOptions;
