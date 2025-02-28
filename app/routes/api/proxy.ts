import { authenticatedData } from "~/.server/api-utils";
import { config } from "~/.server/config";
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

  const viewContext = query.get("_viewContext");
  query.delete("_viewContext");

  if (viewContext) {
    headers.set("x-view-context", viewContext);
  }

  const url = buildUrl(
    pathSplat,
    config.API_BASE_URL,
    Object.fromEntries(query.entries())
  );
  const awaitableData = authenticatedData(
    request,
    [
      {
        url,
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
