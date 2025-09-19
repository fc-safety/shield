import type { ProductCategory, ResultsPage } from "../models";
import { buildPath } from "../urls";

interface GetProductCategoriesOptions {
  order?: {
    name?: "asc" | "desc";
  };
  limit?: number;
}

export const getProductCategoriesFn =
  (fetcher: typeof fetch, options: GetProductCategoriesOptions) => async () => {
    return fetcher(
      buildPath("/product-categories", {
        limit: options.limit ?? 10000,
        order: options.order ?? { name: "asc" },
      })
    )
      .then((r) => r.json() as Promise<ResultsPage<ProductCategory>>)
      .then((r) => r.results)
      .catch((e) => {
        console.error("Error fetching product categories", e);
        return [];
      });
  };

export const getProductCategoriesQueryKey = (options: GetProductCategoriesOptions = {}) => [
  "product-categories",
  options,
];

export const getProductCategoriesQueryOptions = (
  fetcher: typeof fetch,
  options: GetProductCategoriesOptions
) => ({
  queryKey: getProductCategoriesQueryKey(options),
  queryFn: getProductCategoriesFn(fetcher, options),
});
