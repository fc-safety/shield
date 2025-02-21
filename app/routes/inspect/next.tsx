import { isAfter } from "date-fns";
import { api } from "~/.server/api";
import { getSessionValue, inspectionSessionStorage } from "~/.server/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/next";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const activeSessionId = await getSessionValue(
    request,
    inspectionSessionStorage,
    "activeSession"
  );
  return activeSessionId
    ? api.inspections.getSession(request, activeSessionId).mapTo((session) => {
        // Get all points sorted by order.
        const sortedPoints =
          session.inspectionRoute?.inspectionRoutePoints?.sort(
            (a, b) => a.order - b.order
          ) ?? [];

        const sortedCompletedPoints =
          session.completedInspectionRoutePoints?.sort((a, b) =>
            isAfter(a.createdOn, b.createdOn) ? -1 : 1
          ) ?? [];

        // Create a set of completed point assetIds for quick lookup.
        const completedPointAssetIds = new Set(
          sortedCompletedPoints.map(
            (completedPoint) => completedPoint.inspectionRoutePoint?.assetId
          ) ?? []
        );

        const lastCompletedPoint = sortedCompletedPoints.at(0);

        // Find the index of the last completed point.
        const lastCompletedIndex = lastCompletedPoint
          ? sortedPoints.findIndex(
              (point) =>
                point.id === lastCompletedPoint.inspectionRoutePoint?.id
            )
          : -1;

        // Find the next incomplete point after the last completed point, starting
        // back from the beginning if necessary.
        let nextPoint = null;
        for (let i = 0; i < sortedPoints.length; i++) {
          const candidateIdx =
            (i + lastCompletedIndex + 1) % sortedPoints.length;
          if (!completedPointAssetIds.has(sortedPoints[candidateIdx].assetId)) {
            nextPoint = sortedPoints[i];
            break;
          }
        }

        return {
          session,
          nextPoint,
        };
      })
    : {
        session: null,
        nextPoint: null,
      };
};

export default function InspectNext({
  loaderData: { session, nextPoint },
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4">
      <Card className="text-center">
        <CardHeader>
          <CardTitle>Inspection submitted!</CardTitle>
        </CardHeader>
      </Card>
      {nextPoint && (
        <Card>
          <CardHeader>
            <CardTitle>Next Point</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{nextPoint.asset?.name}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
