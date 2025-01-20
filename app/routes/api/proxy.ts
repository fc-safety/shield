import { authenticatedData, buildUrl } from "~/.server/api-utils";
import { getSearchParams, validateParam } from "~/lib/utils";
import type { Route } from "./+types/proxy";

const proxy = ({ request, params }: Route.ActionArgs | Route.LoaderArgs) => {
  const pathSplat = validateParam(params, "*");
  const query = getSearchParams(request);
  const headers = new Headers(request.headers);

  headers.delete("cookie");

  return authenticatedData(request, [
    {
      url: buildUrl(pathSplat, Object.fromEntries(query.entries())),
      options: {
        method: request.method,
        body: request.method !== "GET" ? request.body : undefined,
        headers,
      },
    },
  ]);
};

export const action = proxy;
export const loader = proxy;
