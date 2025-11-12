import { queryOptions } from "@tanstack/react-query";
import type { ProductCategory, ResultsPage } from "../models";
import { buildPath } from "../urls";

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
      "product-categories",
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
