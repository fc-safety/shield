import { ListTodo, Plus, RouteIcon, RouteOff } from "lucide-react";
import type { Asset, InspectionRoute, InspectionSession } from "~/lib/models";
import { Card, CardHeader } from "../../../components/ui/card";

import { useQuery } from "@tanstack/react-query";
import {
  Fragment,
  useCallback,
  useMemo,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { useAuth } from "~/contexts/auth-context";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { can } from "~/lib/users";
import { cn, isNil } from "~/lib/utils";
import EditRoutePointButton from "../../../components/inspections/edit-route-point-button";
import { ResponsiveDialog } from "../../../components/responsive-dialog";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../components/ui/select";
import { Toggle } from "../../../components/ui/toggle";
import { getInspectionRouteDetails } from "../services/inspection-routes";

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

  const RouteToggleContainer = useCallback(
    ({ className, children }: PropsWithChildren<{ className?: string }>) => {
      if (
        !activeRoute &&
        setActiveRoute &&
        matchingRoutes &&
        matchingRoutes.length > 1
      ) {
        const routeMap = new Map(matchingRoutes.map((r) => [r.id, r]));
        return (
          <Select
            onValueChange={(value) => {
              setActiveRoute(routeMap.get(value)!);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-max space-x-2 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
                className
              )}
              title="Include in a route"
            >
              {children}
            </SelectTrigger>
            <SelectContent>
              {matchingRoutes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      const isDisabled = activeRoute
        ? !setRouteDisabled
        : !setActiveRoute || !matchingRoutes || !matchingRoutes.length;
      return (
        <Toggle
          size="sm"
          variant="outline"
          disabled={isDisabled}
          pressed={usingRoute}
          onPressedChange={() => {
            if (setRouteDisabled && activeRoute) {
              setRouteDisabled((prev) => !prev);
            } else if (
              setActiveRoute &&
              !activeRoute &&
              matchingRoutes &&
              matchingRoutes.length === 1
            ) {
              setActiveRoute(matchingRoutes[0]);
            }
          }}
          title={
            routeDisabled
              ? "Include in current route"
              : !activeRoute
              ? "Include in a route"
              : "Exclude from current route"
          }
          className={cn(className)}
        >
          {children}
        </Toggle>
      );
    },
    [
      setRouteDisabled,
      usingRoute,
      routeDisabled,
      matchingRoutes,
      setActiveRoute,
    ]
  );

  return !showRouteCard ? null : (
    <Card className={cn(className)}>
      <CardHeader className="grid gap-2">
        <div className="w-full flex items-center gap-2">
          <RouteToggleContainer>
            {usingRoute ? <RouteIcon className="text-primary" /> : <RouteOff />}
            <span className={cn(usingRoute && "text-primary")}>
              Toggle route
            </span>
          </RouteToggleContainer>
          <div className="flex-1" />
          {canUpdateInspectionRoutes && asset && !isNil(matchingRoutes) && (
            <EditRoutePointButton
              asset={asset}
              filterRoute={(r) => !matchingRoutes.some((mr) => mr.id === r.id)}
              trigger={
                <Button
                  variant="default"
                  size="sm"
                  className="shrink-0 capitalize"
                >
                  <Plus />
                  Add Route
                </Button>
              }
            />
          )}
        </div>
        {usingRoute ? (
          <div className="flex items-center gap-2 w-full">
            <div className="grid gap-2 grow">
              <div className="text-xs font-semibold">
                {activeRoute.name} ({pointsCompletedInRoute}/
                {totalPointsInRoute} completed)
              </div>
              <Progress
                value={
                  totalPointsInRoute > 0
                    ? (pointsCompletedInRoute / totalPointsInRoute) * 100
                    : 0
                }
              />
            </div>
            <ViewRouteProgressDetails
              completedPointIds={
                activeSession?.completedInspectionRoutePoints?.map(
                  (p) => p.inspectionRoutePointId
                ) ?? []
              }
              route={activeRoute}
              currentAssetId={asset?.id}
            />
          </div>
        ) : (
          <div className="italic text-xs">
            {routeDisabled
              ? `This inspection will not be included in ${
                  activeRoute?.name ? `"${activeRoute.name}"` : "the route"
                }.`
              : "No routes available for this asset."}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

function ViewRouteProgressDetails({
  completedPointIds,
  route,
  currentAssetId,
}: {
  completedPointIds: string[];
  route: InspectionRoute;
  currentAssetId?: string;
}) {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const { data: routeDetails, isLoading } = useQuery({
    queryKey: ["inspection-route", route.id],
    queryFn: () => getInspectionRouteDetails(fetchOrThrow, route.id),
  });

  return (
    <ResponsiveDialog
      title={route.name}
      description={`Viewing route progress details.`}
      trigger={
        <Button variant="secondary" size="icon">
          <ListTodo />
        </Button>
      }
      render={({ isDesktop }) =>
        isLoading || !routeDetails ? (
          <Skeleton className="w-full h-48" />
        ) : (
          <RoutePointDetails
            route={routeDetails}
            completedPointIds={completedPointIds}
            className={cn(isDesktop && "pt-4")}
            currentAssetId={currentAssetId}
          />
        )
      }
    />
  );
}

function RoutePointDetails({
  route,
  completedPointIds,
  className,
  currentAssetId,
}: {
  route: InspectionRoute;
  completedPointIds: string[];
  className?: string;
  currentAssetId?: string;
}) {
  const sortedPoints = useMemo(() => {
    return (
      route.inspectionRoutePoints?.slice().sort((a, b) => a.order - b.order) ??
      []
    );
  }, [route]);

  return (
    <div
      className={cn("grid grid-cols-[auto_1fr] gap-2 items-center", className)}
    >
      {sortedPoints.map((point, idx) => (
        <Fragment key={point.id}>
          <div
            className={cn(
              "text-xs font-semibold rounded-full size-7 shrink-0 flex items-center justify-center border border-dashed border-muted-foreground text-muted-foreground",
              completedPointIds.includes(point.id) &&
                "bg-primary text-primary-foreground border-primary border-solid",
              currentAssetId === point.assetId &&
                "bg-primary/20 border-primary text-primary"
            )}
          >
            {idx + 1}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{point.asset?.name}</div>
            <div className="text-xs text-muted-foreground">
              {point.asset?.location} - {point.asset?.placement}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
