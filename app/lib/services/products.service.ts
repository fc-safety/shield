import { queryOptions } from "@tanstack/react-query";
import type { ViewContext } from "~/contexts/view-context";
import type { Product, ResultsPage } from "../models";
import { buildPath } from "../urls";

interface GetProductsOptions {
  productCategoryId?: string;
  manufacturerId?: string;
  clientId?: string;
  viewContext?: ViewContext;
}

export const getProductsQuery = (fetcher: typeof fetch, options: GetProductsOptions = {}) =>
  queryOptions({
    queryKey: ["primary-products", options] as const,
    queryFn: async ({ queryKey }) => {
      const { manufacturerId, productCategoryId, clientId, viewContext } = queryKey[1];
      return fetcher(
        buildPath("/products", {
          limit: 1000,
          type: "PRIMARY",
          productCategory: productCategoryId ? { id: productCategoryId } : undefined,
          manufacturer: manufacturerId ? { id: manufacturerId } : undefined,
          ...(clientId ? { OR: [{ clientId }, { clientId: "_NULL" }] } : {}),
        }),
        { headers: { "x-view-context": viewContext ?? "user" } }
      )
        .then((r) => r.json() as Promise<ResultsPage<Product>>)
        .then((r) => r.results);
    },
  });
