import { queryOptions } from "@tanstack/react-query";
import type { AccessIntent } from "~/.server/api-utils";
import type { ProductCategory, ResultsPage } from "../models";
import { buildPath } from "../urls";

export const PRODUCT_CATEGORIES_QUERY_KEY_PREFIX = "product-categories";

interface GetProductCategoriesOptions {
  order?: {
    name?: "asc" | "desc";
  };
  limit?: number;
}

export const getProductCategoriesQueryOptions = (
  fetcher: typeof fetch,
  options: GetProductCategoriesOptions = {}
) =>
  queryOptions({
    queryKey: [
      PRODUCT_CATEGORIES_QUERY_KEY_PREFIX,
      {
        limit: options.limit ?? 10000,
        order: options.order ?? { name: "asc" },
      },
    ] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/product-categories", queryKey[1]))
        .then((r) => r.json() as Promise<ResultsPage<ProductCategory>>)
        .then((r) => r.results),
  });

interface GetProductCategoriesForSelectorOptions {
  clientId?: string;
  accessIntent?: AccessIntent;
}

export const getProductCategoriesForSelectorQueryOptions = (
  fetcher: typeof fetch,
  options: GetProductCategoriesForSelectorOptions = {}
) => {
  const { clientId, accessIntent } = options;

  const clientFilter = clientId
    ? { OR: [{ clientId }, { clientId: "_NULL" }] }
    : accessIntent === "system"
      ? { clientId: "_NULL" }
      : {};

  return queryOptions({
    queryKey: [
      PRODUCT_CATEGORIES_QUERY_KEY_PREFIX,
      "selector",
      { clientId, accessIntent },
    ] as const,
    queryFn: () =>
      fetcher(
        buildPath("/product-categories", {
          limit: 1000,
          ...clientFilter,
        })
      )
        .then((r) => r.json() as Promise<ResultsPage<ProductCategory>>)
        .then((r) => r.results),
  });
};
