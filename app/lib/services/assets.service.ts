import { queryOptions } from "@tanstack/react-query";
import type { AssetQuestion, AssetQuestionType } from "../models";
import { buildPath } from "../urls";

interface GetAssetQuestionsOptions {
  type: AssetQuestionType;
  siteId: string;
  productId: string;
}

export const getAssetQuestionsByAssetPropertiesQueryOptions = (
  fetcher: typeof fetch,
  options: GetAssetQuestionsOptions
) =>
  queryOptions({
    queryKey: ["asset-questions", { ...options }] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/asset-questions/by-asset-properties/", queryKey[1])).then(
        (r) => r.json() as Promise<AssetQuestion[]>
      ),
  });
