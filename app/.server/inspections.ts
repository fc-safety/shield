import { redirect } from "react-router";
import { inspectionSessionStorage } from "~/.server/sessions";
import type { InspectionRoute, InspectionSession } from "~/lib/models";
import { dateSort, getSearchParams } from "../lib/utils";
import { api } from "./api";

export const validateInspectionSession = async (
  request: Request,
  session?: Awaited<ReturnType<typeof inspectionSessionStorage.getSession>>
) => {
  const inspectionSession =
    session ??
    (await inspectionSessionStorage.getSession(request.headers.get("cookie")));

  const inspectionToken = inspectionSession.get("inspectionToken");

  if (!inspectionToken) {
    throw new Response("No active inspection session.", {
      status: 400,
    });
  }

  const validateInspectionTokenResult =
    await api.inspectionsPublic.validateInspectionToken(
      request,
      inspectionToken
    );

  if (!validateInspectionTokenResult.isValid) {
    throw new Response(
      validateInspectionTokenResult.reason ??
        "Failed to validate inspection session.",
      {
        status: 400,
      }
    );
  }

  return { inspectionToken, ...validateInspectionTokenResult };
};

export const validateTagRequestAndBuildSession = async (
  request: Request,
  redirectTo: string
) => {
  const requestQuery = getSearchParams(request);

  // Step 1: Get the tag ID from the request query. This should only be present when initially scanning a tag.
  //
  // NOTE: As of this 2025 Shield redesign, tags are being programmed with signed URLs. This allows us to trust
  // the incoming tag ID (or external ID) even if it hasn't been created in our system yet.
  //
  // However, in order to continue supporting already programmed and in-use tags, we also check for the `extId`
  // param. We don't expect these tag URLs to be accompanied by a signature, but they should always already exist
  // in our system.
  //
  // Thus validation allows two methods:
  // 1. Validate signature if present (then look up tag and create if not present)
  // 2. Or, simply look up tag and consider valid if found.
  let extId = requestQuery.get("id") ?? requestQuery.get("extId");
  let isValidNewTagUrl = false;
  let inspectionToken: string | undefined;

  // Step 2: Validate the tag signature if present. Again, this should only be present when initially scanning a tag.
  // This is validation method #1.
  if (requestQuery.has("sig")) {
    const {
      isValid: isValidSignature,
      inspectionToken: inspectionTokenFromSignature,
    } = await api.inspectionsPublic.isValidTagUrl(request, request.url);

    if (!isValidSignature) {
      throw new Response("Invalid tag signature.", {
        status: 400,
      });
    }

    isValidNewTagUrl = true;
    inspectionToken = inspectionTokenFromSignature;
  }

  const inspectionSession = await inspectionSessionStorage.getSession(
    request.headers.get("cookie")
  );

  if (extId) {
    // Step 3 (part A): If there is no valid signature, but the tag ID is present, validate the tag ID.
    // This is validation method #2.
    if (!isValidNewTagUrl) {
      const {
        isValid: isValidTagId,
        inspectionToken: inspectionTokenFromTagId,
      } = await api.inspectionsPublic.isValidTagId(request, { extId });

      isValidNewTagUrl = isValidTagId;
      inspectionToken = inspectionTokenFromTagId;
    }

    if (!isValidNewTagUrl || !extId) {
      throw new Response("Tag not found", { status: 404 });
    }

    // Step 3 (part B): If this is a valid new tag URL, set session data and redirect
    // to remove the tag params from the URL.
    inspectionSession.set("activeTag", extId);
    inspectionSession.set("tagActivatedOn", new Date().toISOString());
    inspectionSession.set("inspectionToken", inspectionToken);

    // Redirect to remove the tag params from the URL. This prevents users from bookmarking or
    // sharing the tag URL.
    throw redirect(redirectTo, {
      headers: {
        "Set-Cookie": await inspectionSessionStorage.commitSession(
          inspectionSession
        ),
      },
    });
  }

  // Step 4: If pulling from session, validate session and get tag ID.
  const validatedInspectionSessionContext = await validateInspectionSession(
    request,
    inspectionSession
  );

  // Step 5: Get and return tag context.
  return validatedInspectionSessionContext;
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
  for (let i = 0; i < sortedPoints.length; i++) {
    const candidateIdx = (i + lastCompletedIndex + 1) % sortedPoints.length;
    const candidatePoint = sortedPoints[candidateIdx];
    if (!completedPointAssetIds.has(candidatePoint.assetId)) {
      nextPoint = candidatePoint;
      break;
    }
  }

  return { nextPoint };
};

/**
 * Fetches the active inspection route context for the given asset.
 *
 * This function will return a list of active sessions for the given asset,
 * as well as the matching routes for those sessions. It will also check
 * for any sessions that should be marked as completed and update the session
 * if necessary.
 *
 * If there are no active sessions, it will return all routes for the asset.
 *
 * @param request - The HTTP request object.
 * @param assetId - The ID of the asset to fetch inspection route context for.
 * @returns An object containing the active sessions and matching routes.
 */
export const fetchActiveInspectionRouteContext = async (
  request: Request,
  assetId: string,
  options: {
    resetSession?: boolean;
    sessionId?: string;
  } = {}
) => {
  // Get all sessions for this asset that are not marked as complete.
  let activeOrRecentlyExpiredSessions =
    await api.inspections.getActiveOrRecentlyExpiredSessionsForAsset(
      request,
      assetId
    );

  if (options.sessionId) {
    activeOrRecentlyExpiredSessions = activeOrRecentlyExpiredSessions.filter(
      (session) => session.id === options.sessionId
    );

    const session = activeOrRecentlyExpiredSessions.at(0);
    if (session && options.resetSession) {
      await api.inspections.cancelRouteSession(request, session.id);
      activeOrRecentlyExpiredSessions = [];
    }
  }

  // Get matching routes either from the remaining session(s), or, if no active
  // sessions, get all routes for the asset.
  let matchingRoutes: InspectionRoute[] | null = null;
  if (activeOrRecentlyExpiredSessions.length === 0) {
    matchingRoutes = await api.inspectionRoutes.getForAssetId(request, assetId);
  } else {
    matchingRoutes = activeOrRecentlyExpiredSessions
      .map((session) => session.inspectionRoute)
      .filter((r): r is InspectionRoute => !!r);
  }

  return {
    activeOrRecentlyExpiredSessions,
    matchingRoutes,
  };
};
