import { queryOptions } from "@tanstack/react-query";
import type { AccessIntent } from "~/.server/api-utils";
import type { Manufacturer, ResultsPage } from "../models";
import { buildPath } from "../urls";

export const MANUFACTURERS_QUERY_KEY_PREFIX = "manufacturers";

interface GetManufacturersForSelectorOptions {
  clientId?: string;
  accessIntent?: AccessIntent;
}

export const getManufacturersForSelectorQueryOptions = (
  fetcher: typeof fetch,
  options: GetManufacturersForSelectorOptions = {}
) => {
  const { clientId, accessIntent } = options;

  const clientFilter = clientId
    ? { OR: [{ clientId }, { clientId: "_NULL" }] }
    : accessIntent !== "user"
      ? { clientId: "_NULL" }
      : {};

  return queryOptions({
    queryKey: [
      MANUFACTURERS_QUERY_KEY_PREFIX,
      "selector",
      { clientId, accessIntent },
    ] as const,
    queryFn: () =>
      fetcher(
        buildPath("/manufacturers", {
          limit: 1000,
          ...clientFilter,
        })
      )
        .then((r) => r.json() as Promise<ResultsPage<Manufacturer>>)
        .then((r) => r.results),
  });
};
