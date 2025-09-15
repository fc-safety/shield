import type { QueryOptions } from "@tanstack/react-query";
import type { ViewContext } from "~/.server/api-utils";
import type { Asset, ResultsPage } from "~/lib/models";
import { buildPath } from "~/lib/urls";

export const getAssetsFn = async (
  fetcher: typeof fetch,
  options: {
    siteId?: string;
    clientId?: string;
    context?: ViewContext;
    noTag?: boolean;
  } = {}
) => {
  const assets = await fetcher(
    buildPath("/assets", {
      limit: 1000,
      siteId: options.siteId,
      clientId: options.clientId,
      tagId: options.noTag ? "_NULL" : undefined,
    }),
    {
      headers: {
        "X-View-Context": options.context ?? "user",
      },
    }
  );
  const result = (await assets.json()) as ResultsPage<Asset>;
  return result.results;
};

export const getAssetsQuery = (
  fetcher: typeof fetch,
  options?: Parameters<typeof getAssetsFn>[1]
) =>
  ({
    queryFn: () => getAssetsFn(fetcher, options),
    queryKey: ["assets", options],
  }) satisfies QueryOptions;
