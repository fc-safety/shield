import { authenticatedData } from "~/.server/api-utils";
import { API_BASE_URL } from "~/.server/config";
import { buildUrl } from "~/lib/urls";
import { getSearchParams, validateParam } from "~/lib/utils";
import type { Route } from "./+types/proxy";

const proxy = async ({
  request,
  params,
}: Route.ActionArgs | Route.LoaderArgs) => {
  const pathSplat = validateParam(params, "*");
  const query = getSearchParams(request);
  const headers = new Headers(request.headers);

  headers.delete("cookie");

  const method = (query.get("_method") ?? request.method).toUpperCase();
  query.delete("_method");

  const doThrow = query.get("_throw") !== "false";
  query.delete("_throw");

  const awaitableData = authenticatedData(
    request,
    [
      {
        url: buildUrl(
          pathSplat,
          API_BASE_URL,
          Object.fromEntries(query.entries())
        ),
        options: {
          method: method,
          body: method !== "GET" ? await request.text() : undefined,
          headers,
        },
      },
    ],
    {
      returnTo:
        headers.get("referer") ?? headers.get("x-return-to") ?? undefined,
    }
  );

  if (doThrow) {
    return awaitableData;
  }

  return awaitableData.catchResponse();
};

export const action = proxy;
export const loader = proxy;
