import { queryOptions } from "@tanstack/react-query";
import type { AccessIntent } from "~/.server/api-utils";
import type { ViewContext } from "~/contexts/requested-access-context";
import type { Product, ResultsPage } from "~/lib/models";
import { buildPath } from "~/lib/urls";
import { dedupById } from "~/lib/utils";

interface GetProductsOptions {
  productCategoryId?: string;
  manufacturerId?: string;
  clientId?: string;
  /** @deprecated Use `accessIntent` instead. */
  viewContext?: ViewContext;
  accessIntent?: AccessIntent;
}

export const getPrimaryProductsFn = async (
  fetcher: typeof fetch,
  options: GetProductsOptions = {}
) =>
  fetcher(
    buildPath("/products", {
      limit: 1000,
      type: "PRIMARY",
      productCategory: options.productCategoryId ? { id: options.productCategoryId } : undefined,
      manufacturer: options.manufacturerId ? { id: options.manufacturerId } : undefined,
      ...(options.clientId ? { OR: [{ clientId: options.clientId }, { clientId: "_NULL" }] } : {}),
    }),
    { headers: { "x-access-intent": options.accessIntent ?? "user" } }
  )
    .then((r) => r.json() as Promise<ResultsPage<Product>>)
    .then((r) => r.results);

export const getProductsQuery = (fetcher: typeof fetch, options: GetProductsOptions = {}) =>
  queryOptions({
    queryKey: ["primary-products", options] as const,
    queryFn: ({ queryKey }) => getPrimaryProductsFn(fetcher, queryKey[1]),
  });

export const getCategoriesByProductQuery = (
  fetcher: typeof fetch,
  options: GetProductsOptions = {}
) =>
  queryOptions({
    queryKey: ["categories-by-product", { ...options }] as const,
    queryFn: ({ queryKey }) =>
      getPrimaryProductsFn(fetcher, queryKey[1])
        .then((products) => dedupById(products.map((p) => p.productCategory)))
        .then((categories) =>
          categories.sort((a, b) => (a.shortName ?? a.name).localeCompare(b.shortName ?? b.name))
        ),
  });

export const getManufacturersByProductQuery = (
  fetcher: typeof fetch,
  options: GetProductsOptions = {}
) =>
  queryOptions({
    queryKey: ["manufacturers-by-product", { ...options }] as const,
    queryFn: ({ queryKey }) =>
      getPrimaryProductsFn(fetcher, queryKey[1])
        .then((products) => dedupById(products.map((p) => p.manufacturer)))
        .then((manufacturers) => manufacturers.sort((a, b) => a.name.localeCompare(b.name))),
  });
