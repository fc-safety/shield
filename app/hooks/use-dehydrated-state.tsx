import type { DehydratedState } from "@tanstack/query-core";

import merge from "deepmerge";
import { useMatches } from "react-router";

export const useDehydratedState = (): DehydratedState => {
  const matches = useMatches();

  const dehydratedState = matches
    .map((match) => {
      if (
        match.loaderData !== null &&
        typeof match.loaderData === "object" &&
        "dehydratedState" in match.loaderData
      ) {
        return match.loaderData.dehydratedState as DehydratedState;
      }
      return undefined;
    })
    .filter((state): state is DehydratedState => state !== undefined);

  return dehydratedState.length
    ? dehydratedState.reduce((accumulator, currentValue) => merge(accumulator, currentValue), {
        mutations: [],
        queries: [],
      } as DehydratedState)
    : ({ mutations: [], queries: [] } as DehydratedState);
};
