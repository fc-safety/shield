import { add, isAfter, type Duration } from "date-fns";
import { redirect } from "react-router";
import { inspectionSessionStorage } from "~/.server/sessions";
import type { InspectionRoute, InspectionSession } from "~/lib/models";
import { dateSort, getSearchParam } from "../lib/utils";

const TAG_SESSION_DURATION: Duration = { hours: 1 };

export const validateTagId = async (request: Request, redirectTo: string) => {
  let extId = getSearchParam(request, "extId");
  const inspectionSession = await inspectionSessionStorage.getSession(
    request.headers.get("cookie")
  );

  if (extId) {
    inspectionSession.set("activeTag", extId);
    inspectionSession.set("tagActivatedOn", new Date().toISOString());
    throw redirect(redirectTo, {
      headers: {
        "Set-Cookie": await inspectionSessionStorage.commitSession(
          inspectionSession
        ),
      },
    });
  }
  extId = inspectionSession.get("activeTag") ?? null;
  const tagActivatedOn = inspectionSession.get("tagActivatedOn");

  if (
    !tagActivatedOn ||
    isAfter(new Date(), add(new Date(tagActivatedOn), TAG_SESSION_DURATION))
  ) {
    throw new Response("Tag session expired.", {
      status: 400,
    });
  }

  if (!extId) {
    throw new Response("No tag ID provided.", {
      status: 400,
    });
  }

  return extId;
};

export const getNextPointFromSession = (
  session: InspectionSession,
  route?: InspectionRoute
) => {
  let thisRoute = route;

  if (!thisRoute?.inspectionRoutePoints) {
    thisRoute = session.inspectionRoute;
  }

  if (
    !thisRoute?.inspectionRoutePoints ||
    !session.completedInspectionRoutePoints
  ) {
    return { nextPoint: null, routeCompleted: false };
  }

  // Get all points sorted by order.
  const sortedPoints =
    thisRoute.inspectionRoutePoints.sort((a, b) => a.order - b.order) ?? [];

  const sortedCompletedPoints =
    session.completedInspectionRoutePoints.sort(dateSort("createdOn")) ?? [];

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
        (point) => point.id === lastCompletedPoint.inspectionRoutePoint?.id
      )
    : -1;

  // Find the next incomplete point after the last completed point, starting
  // back from the beginning if necessary.
  let nextPoint = null;
  let routeCompleted = true;
  for (let i = 0; i < sortedPoints.length; i++) {
    const candidateIdx = (i + lastCompletedIndex + 1) % sortedPoints.length;
    const candidatePoint = sortedPoints[candidateIdx];
    if (!completedPointAssetIds.has(candidatePoint.assetId)) {
      routeCompleted = false;
      nextPoint = candidatePoint;
      break;
    }
  }

  return { nextPoint, routeCompleted };
};
