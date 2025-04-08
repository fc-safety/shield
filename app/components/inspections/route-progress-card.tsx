import { Plus, RouteIcon, RouteOff } from "lucide-react";
import type { Asset, InspectionRoute, InspectionSession } from "~/lib/models";
import { Card, CardHeader } from "../ui/card";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "~/contexts/auth-context";
import { can } from "~/lib/users";
import { cn, isNil } from "~/lib/utils";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import EditRoutePointButton from "./edit-route-point-button";

export default function RouteProgressCard({
  activeRoute: activeRouteProp,
  activeSession,
  setActiveRoute,
  matchingRoutes,
  routeDisabled,
  setRouteDisabled,
  asset,
  className,
}: {
  activeSession: InspectionSession | null | undefined;
  activeRoute?: InspectionRoute | null | undefined;
  setActiveRoute?: (route: InspectionRoute) => void;
  matchingRoutes?: InspectionRoute[] | null | undefined;
  routeDisabled?: boolean;
  setRouteDisabled?: Dispatch<SetStateAction<boolean>>;
  asset?: Asset;
  className?: string;
}) {
  const { user } = useAuth();
  const canUpdateInspectionRoutes = can(user, "update", "inspection-routes");

  const activeRoute = useMemo(
    () => activeRouteProp ?? activeSession?.inspectionRoute,
    [activeRouteProp, activeSession]
  );

  const showRouteCard =
    !!activeRoute ||
    (!!matchingRoutes && matchingRoutes.length > 0) ||
    canUpdateInspectionRoutes;

  const usingRoute = !!activeRoute && !routeDisabled;

  const totalPointsInRoute = activeRoute?.inspectionRoutePoints?.length ?? 0;
  const pointsCompletedInRoute = useMemo(() => {
    if (
      !activeSession?.completedInspectionRoutePoints ||
      !activeRoute?.inspectionRoutePoints
    ) {
      return 0;
    }

    const assetsToComplete = new Set(
      activeRoute.inspectionRoutePoints.map((p) => p.assetId)
    );

    for (const point of activeSession.completedInspectionRoutePoints) {
      if (
        point.inspectionRoutePoint?.assetId &&
        assetsToComplete.has(point.inspectionRoutePoint.assetId)
      ) {
        assetsToComplete.delete(point.inspectionRoutePoint.assetId);
      }
    }

    return activeRoute.inspectionRoutePoints.length - assetsToComplete.size;
  }, [activeSession, activeRoute]);

  return !showRouteCard ? null : (
    <Card className={cn(className)}>
      <CardHeader className="grid gap-4">
        <div className="flex items-center gap-2">
          {usingRoute ? (
            <RouteIcon className="size-5 text-primary" />
          ) : (
            <RouteOff className="size-5 text-muted-foreground" />
          )}
          <div
            className={cn(
              "text-base font-semibold",
              usingRoute ? "text-primary" : "text-muted-foreground"
            )}
          >
            {usingRoute
              ? activeSession?.status === "COMPLETE"
                ? "Route Complete"
                : "Route in Progress"
              : "No Route"}
          </div>
          <div className="flex-1"></div>
          {setRouteDisabled && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRouteDisabled((prev) => !prev)}
            >
              {routeDisabled ? "Include in Route" : "Exclude from Route"}
            </Button>
          )}
        </div>
        <div className="grid gap-2">
          <div className="text-xs font-semibold">Route</div>
          <div className="flex items-center gap-2 w-full">
            <div className="text-xs text-muted-foreground grow">
              {!routeDisabled &&
              setActiveRoute &&
              matchingRoutes &&
              matchingRoutes.length > 1 ? (
                <Select
                  value={activeRoute?.id}
                  onValueChange={(value) => {
                    const route = matchingRoutes.find(
                      (route) => route.id === value
                    );
                    if (route) {
                      setActiveRoute(route);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {matchingRoutes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : usingRoute ? (
                activeRoute.name
              ) : (
                <span className="italic">
                  {routeDisabled
                    ? "This inspection will not be included in the route."
                    : "No routes available for this asset."}
                </span>
              )}
            </div>
            {canUpdateInspectionRoutes && asset && !isNil(matchingRoutes) && (
              <EditRoutePointButton
                asset={asset}
                filterRoute={(r) =>
                  !matchingRoutes.some((mr) => mr.id === r.id)
                }
                trigger={
                  <Button variant="default" size="sm" className="shrink-0">
                    <Plus />
                    Add to Route
                  </Button>
                }
              />
            )}
          </div>
        </div>
        {usingRoute && (
          <div className="grid gap-2">
            <div className="text-xs font-semibold">
              Inspections Completed ({pointsCompletedInRoute}/
              {totalPointsInRoute})
            </div>
            <Progress
              value={
                totalPointsInRoute > 0
                  ? (pointsCompletedInRoute / totalPointsInRoute) * 100
                  : 0
              }
            />
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
