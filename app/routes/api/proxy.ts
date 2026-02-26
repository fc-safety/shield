import { ApiFetcher, catchResponse } from "~/.server/api-utils";
import { getSearchParams, validateParam } from "~/lib/utils";
import type { Route } from "./+types/proxy";
const INSPECTION_TOKEN_HEADER = "x-inspection-token";

const ALLOWED_PASSTHROUGH_HEADERS = [
  "Content-Type",
  "X-View-Context",
  "X-Client-Id",
  "X-Site-Id",
  "X-Access-Intent",
  "X-Inspection-Token",
  "Accept",
  "Referer",
];

const proxy = async ({ request, params }: Route.ActionArgs | Route.LoaderArgs) => {
  const pathSplat = validateParam(params, "*");
  const query = getSearchParams(request);
  const headers = new Headers();

  for (const header of ALLOWED_PASSTHROUGH_HEADERS) {
    if (request.headers.has(header)) {
      headers.set(header, request.headers.get(header)!);
    }
  }

  const method = (query.get("_method") ?? request.method).toUpperCase();
  query.delete("_method");

  const doThrow = query.get("_throw") !== "false";
  query.delete("_throw");

  const accessIntent = query.get("_accessIntent");
  query.delete("_accessIntent");

  const viewContext = query.get("_viewContext");
  query.delete("_viewContext");

  if (accessIntent) {
    headers.set("x-access-intent", accessIntent);
  } else if (viewContext) {
    headers.set("x-view-context", viewContext);
  }

  const clientId = query.get("_clientId");
  query.delete("_clientId");

  if (clientId) {
    headers.set("x-client-id", clientId);
  }

  const siteId = query.get("_siteId");
  query.delete("_siteId");

  if (siteId) {
    headers.set("x-site-id", siteId);
  }

  const inspectionToken = query.get("_inspectionToken");
  query.delete("_inspectionToken");

  if (inspectionToken) {
    headers.set(INSPECTION_TOKEN_HEADER, inspectionToken);
  }

  const awaitableData = ApiFetcher.create(request, pathSplat, Object.fromEntries(query.entries()))
    .setHeaders(headers)
    .body(method !== "GET" ? await request.text() : undefined)
    .fetch({
      method,
      returnTo: headers.get("referer") ?? headers.get("x-return-to") ?? undefined,
    });

  if (doThrow) {
    return awaitableData;
  }

  return catchResponse(awaitableData);
};

export const action = proxy;
export const loader = proxy;
