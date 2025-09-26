import type { AssetQuestion, AssetQuestionType } from "../models";
import { buildPath } from "../urls";

interface GetAssetQuestionsOptions {
  type: AssetQuestionType;
  siteId: string;
  productId: string;
}

export const getAssetQuestionsByAssetPropertiesQueryKey = (options: GetAssetQuestionsOptions) =>
  ["asset-questions", { ...options }] as const;

export const getAssetQuestionsByAssetPropertiesFn =
  (fetcher: typeof fetch) =>
  async ({
    queryKey,
  }: {
    queryKey: ReturnType<typeof getAssetQuestionsByAssetPropertiesQueryKey>;
  }) => {
    const [, query] = queryKey;
    return fetcher(buildPath("/asset-questions/by-asset-properties/", query)).then(
      (r) => r.json() as Promise<AssetQuestion[]>
    );
  };

export const getAssetQuestionsByAssetPropertiesQueryOptions = (
  fetcher: typeof fetch,
  options: GetAssetQuestionsOptions
) => ({
  queryKey: getAssetQuestionsByAssetPropertiesQueryKey(options),
  queryFn: getAssetQuestionsByAssetPropertiesFn(fetcher),
});
