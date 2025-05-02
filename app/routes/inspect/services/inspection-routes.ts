import type { InspectionRoute } from "~/lib/models";

export const getInspectionRouteDetails = async (
  fetcher: typeof fetch,
  routeId: string
) => {
  const response = await fetcher(`/inspection-routes/${routeId}`, {
    method: "GET",
  });

  return response.json() as Promise<InspectionRoute>;
};
