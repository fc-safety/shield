import HydrationSafeFormattedDate from "@/components/common/hydration-safe-formatted-date";
import DataList from "@/components/data-list";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDndMonitor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Nfc, Pencil, Plus, Trash } from "lucide-react";
import { forwardRef, useEffect, useMemo, useState, type HTMLAttributes } from "react";
import { useFetcher, type FetcherWithComponents } from "react-router";
import { useImmer } from "use-immer";
import ActiveIndicator from "~/components/active-indicator";
import ConfirmationDialog from "~/components/confirmation-dialog";
import { HelpSidebarContent, HelpSidebarSection } from "~/components/help-sidebar";
import HelpbarTrigger from "~/components/helpbar-trigger";
import EditRouteButton from "~/components/inspections/edit-route-button";
import EditRoutePointButton from "~/components/inspections/edit-route-point-button";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import type { InspectionRoute, InspectionRoutePoint } from "~/lib/models";
import { can, getUserDisplayName } from "~/lib/users";
import { cn } from "~/lib/utils";

export default function InspectionRouteDetails({ route }: { route: InspectionRoute }) {
  const { user } = useAuth();
  const canUpdate = can(user, "update", "inspection-routes");
  const canDelete = can(user, "delete", "inspection-routes");

  const deleteRouteFetcher = useFetcher();
  const [deleteRouteAction, setDeleteRouteAction] = useConfirmAction({
    variant: "destructive",
    defaultProps: {
      title: "Delete Route",
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 2,
      },
    })
  );

  const initialPoints = useMemo(() => {
    return route.inspectionRoutePoints?.slice().sort((a, b) => a.order - b.order) ?? [];
  }, [route.inspectionRoutePoints]);
  const [initialPointsLoading, setInitialPointsLoading] = useState(true);
  const [points, setPoints] = useImmer<InspectionRoutePoint[]>([]);

  useEffect(() => {
    setPoints(initialPoints);
    setInitialPointsLoading(false);
  }, [initialPoints, setPoints]);

  const [activePoint, setActivePoint] = useState<{
    point: InspectionRoutePoint;
    idx: number;
  } | null>(null);

  const activeSession = useMemo(() => {
    return route.inspectionSessions?.find((s) => s.status === "PENDING") ?? null;
  }, [route.inspectionSessions]);

  const reorderFetcher = useFetcher();
  const deletePointFetcher = useFetcher();
  const [deletePointAction, setDeletePointAction] = useConfirmAction({
    variant: "destructive",
    defaultProps: {
      title: "Remove Route Point",
    },
  });

  const handleReorder = (id: string, order: number) => {
    reorderFetcher.submit(
      { id, order },
      {
        method: "post",
        action: `/api/proxy/inspection-routes/${route.id}/points/reorder`,
        encType: "application/json",
      }
    );
  };

  const handleDeleteRoute = (route: InspectionRoute) => {
    setDeleteRouteAction((draft) => {
      draft.open = true;
      draft.message = `Are you sure you want to delete "${route.name}"?`;
      draft.requiredUserInput = route.name;
      draft.onConfirm = () => {
        deleteRouteFetcher.submit(
          { id: route.id },
          {
            method: "delete",
            action: `/api/proxy/inspection-routes/${route.id}`,
          }
        );
      };
    });
  };

  const handleDeletePoint = (routePoint: InspectionRoutePoint) => {
    setDeletePointAction((draft) => {
      draft.open = true;
      draft.message = `Are you sure you want to remove "${routePoint.asset?.name}" from this route?`;
      draft.onConfirm = () => {
        deletePointFetcher.submit(
          { id: routePoint.id },
          {
            method: "delete",
            action: `/api/proxy/inspection-routes/${route.id}/points/${routePoint.id}`,
          }
        );
      };
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    const pointIndex = points.findIndex((point) => point.id === active.id);
    setActivePoint({ point: points[pointIndex], idx: pointIndex });
  };

  const handleDragCancel = () => {
    setActivePoint(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const overPoint = points.find((point) => point.id === over.id);

      setPoints((draft) => {
        const fromIdx = draft.findIndex((point) => point.id === active.id);
        const toIdx = draft.findIndex((point) => point.id === over.id);
        draft.splice(toIdx, 0, draft.splice(fromIdx, 1)[0]);
      });

      if (overPoint) {
        handleReorder(String(active.id), overPoint.order);
      }
    }

    handleDragCancel();
  };

  return (
    <>
      <Card className="text-start" id={`route-id-${route.id}`}>
        <CardHeader className="flex-row gap-2">
          <CardHeader className="p-0 sm:p-0">
            <CardTitle>{route.name}</CardTitle>
            <CardDescription>
              {route.description || <span className="italic">No description.</span>}
            </CardDescription>
          </CardHeader>
          <div className="flex-1"></div>
          <ButtonGroup>
            {canUpdate && (
              <ButtonGroup>
                <EditRouteButton
                  route={route}
                  trigger={
                    <Button size="icon" variant="secondary">
                      <Pencil />
                    </Button>
                  }
                />
              </ButtonGroup>
            )}
            {canDelete && (
              <ButtonGroup>
                <Button size="icon" variant="destructive" onClick={() => handleDeleteRoute(route)}>
                  <Trash />
                </Button>
              </ButtonGroup>
            )}
          </ButtonGroup>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <DataList
            title="Details"
            details={[
              {
                label: "Site",
                value: route.site?.name,
              },
              {
                label: "Created On",
                value: <HydrationSafeFormattedDate date={route.createdOn} formatStr="PPpp" />,
              },
              {
                label: "Modified On",
                value: <HydrationSafeFormattedDate date={route.modifiedOn} formatStr="PPpp" />,
              },
            ]}
            defaultValue={<>&mdash;</>}
            fluid
            className="w-max"
          />
          <div className="flex flex-col gap-2">
            <h3 className="text-md flex items-center gap-2 font-semibold">
              Route Points
              {canUpdate && (
                <HelpbarTrigger
                  content={
                    <HelpSidebarContent>
                      <HelpSidebarSection
                        title="Adding Route Points Manually"
                        content={`
                            You can add route points by clicking the
                            'Manually Add Point' button below the route
                            points list. You will be prompted to select which
                            asset you would like to add to the route.
                        `}
                      />
                      <HelpSidebarSection
                        title="Adding Route Points via NFC"
                        content={[
                          `You can also add route points by scanning the NFC tag
                            on the asset and adding the asset to the route via the
                            inspection page.`,
                          `On the inspection page there will be an 'Add to
                            Route' button that will allow you to add the
                            asset to any of your existing routes.`,
                        ]}
                      />
                    </HelpSidebarContent>
                  }
                />
              )}
            </h3>
            {activeSession && (
              <Badge variant="primary-soft">
                <ActiveIndicator active={true} />
                {activeSession.lastInspector ? (
                  <span>
                    <span className="font-semibold">
                      {getUserDisplayName(activeSession.lastInspector)}
                    </span>{" "}
                    started this route on{" "}
                    <HydrationSafeFormattedDate date={activeSession.createdOn} formatStr="PP" />
                  </span>
                ) : (
                  "Route in progress"
                )}
              </Badge>
            )}
            {initialPointsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !points || points.length === 0 ? (
              <div className="text-muted-foreground text-sm">No route points added yet.</div>
            ) : null}
            {points && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
                onDragAbort={handleDragCancel}
              >
                <SortableContext
                  items={points.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid">
                    {points.map((point, idx) => (
                      <SortableRoutePointItem
                        key={point.id}
                        point={point}
                        isIncomplete={
                          !!activeSession?.completedInspectionRoutePoints &&
                          !activeSession.completedInspectionRoutePoints.some(
                            (p) => p.inspectionRoutePointId === point.id
                          )
                        }
                        idx={idx}
                        allPoints={points}
                        reorderFetcher={reorderFetcher}
                        deleteFetcher={deletePointFetcher}
                        handleReorder={handleReorder}
                        handleDelete={handleDeletePoint}
                        className={cn(
                          activePoint && activePoint.idx === idx && "pointer-events-none opacity-50"
                        )}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activePoint ? (
                    <RoutePointItem
                      point={activePoint.point}
                      isIncomplete={
                        !!activeSession?.completedInspectionRoutePoints &&
                        !activeSession.completedInspectionRoutePoints.some(
                          (p) => p.inspectionRoutePointId === activePoint.point.id
                        )
                      }
                      idx={activePoint.idx}
                      allPoints={points}
                      reorderFetcher={reorderFetcher}
                      deleteFetcher={deletePointFetcher}
                      handleReorder={handleReorder}
                      handleDelete={handleDeletePoint}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          {canUpdate && (
            <EditRoutePointButton
              route={route}
              trigger={
                <Button size="sm" variant="outline">
                  <Plus />
                  Manually Add Point
                </Button>
              }
            />
          )}
        </CardFooter>
      </Card>
      <ConfirmationDialog {...deletePointAction} />
      <ConfirmationDialog {...deleteRouteAction} />
    </>
  );
}

interface RoutePointItemProps extends HTMLAttributes<HTMLDivElement> {
  point: InspectionRoutePoint;
  isIncomplete: boolean;
  allPoints: InspectionRoutePoint[];
  idx: number;
  reorderFetcher: FetcherWithComponents<unknown>;
  deleteFetcher: FetcherWithComponents<unknown>;
  handleReorder: (id: string, order: number) => void;
  handleDelete: (point: InspectionRoutePoint) => void;
}

const SortableRoutePointItem = (props: RoutePointItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.point.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useDndMonitor({
    onDragStart: disableBodyScroll,
    onDragEnd: enableBodyScroll,
    onDragCancel: enableBodyScroll,
    onDragAbort: enableBodyScroll,
  });

  return (
    <RoutePointItem {...props} ref={setNodeRef} {...attributes} {...listeners} style={style} />
  );
};

const RoutePointItem = forwardRef<HTMLDivElement, RoutePointItemProps>(
  (
    {
      point,
      isIncomplete,
      allPoints,
      idx,
      reorderFetcher,
      deleteFetcher,
      handleReorder,
      handleDelete,
      style,
      className,
      ...props
    }: RoutePointItemProps,
    ref
  ) => {
    const { user } = useAuth();
    const canUpdate = can(user, "update", "inspection-routes");

    const getNextOrder = (idx: number) => {
      if (!allPoints) return 0;
      // If last element in array, return the order of the last element + 1.
      if (idx >= allPoints.length) {
        return (allPoints.at(-1)?.order ?? -1) + 1;
      }
      // If not last element, return the order of the next element.
      return allPoints[idx + 1].order;
    };

    const getPreviousOrder = (idx: number) => {
      if (!allPoints) return 0;
      // If first element in array, return the order of the first element - 1.
      if (idx <= 0) return (allPoints.at(0)?.order ?? -1) - 1;
      // If not first element, return the order of the previous element.
      return allPoints[idx - 1].order;
    };

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          "bg-card -mx-2 flex min-w-0 items-center gap-1.5 rounded-md p-2 sm:gap-3",
          className
        )}
      >
        {canUpdate && (
          <div {...props} style={{ touchAction: "manipulation" }}>
            <GripVertical className="size-4" />
          </div>
        )}
        <div
          className={cn(
            "bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:size-7",
            isIncomplete && "bg-primary/20 text-primary/80 border-primary border border-dashed"
          )}
          title={
            isIncomplete
              ? "This asset has not yet been inspected by the current inspector"
              : undefined
          }
        >
          {idx + 1}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm font-semibold">
            {point.asset?.name}
            {point.asset?.tag && (
              <Badge variant="secondary" className="min-w-0 shrink">
                <Nfc className="text-primary" />
                <span className="truncate">{point.asset.tag.serialNumber}</span>
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            {point.asset?.location} - {point.asset?.placement}
          </div>
        </div>
        {canUpdate && (
          <ButtonGroup>
            <ButtonGroup>
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={
                  !allPoints || idx === allPoints.length - 1 || reorderFetcher.state !== "idle"
                }
                onClick={() => handleReorder(point.id, getNextOrder(idx))}
              >
                <ArrowDown />
              </Button>
              <ButtonGroupSeparator />
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={idx === 0 || reorderFetcher.state !== "idle"}
                onClick={() => handleReorder(point.id, getPreviousOrder(idx))}
              >
                <ArrowUp />
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button
                size="icon-sm"
                variant="destructive"
                disabled={deleteFetcher.state !== "idle"}
                onClick={() => handleDelete(point)}
                className="shrink-0"
              >
                <Trash />
              </Button>
            </ButtonGroup>
          </ButtonGroup>
        )}
      </div>
    );
  }
);

RoutePointItem.displayName = "RoutePointItem";

const disableBodyScroll = () => {
  document.body.classList.add("touch-none");
  document.body.classList.add("overflow-hidden");
};

const enableBodyScroll = () => {
  document.body.classList.remove("touch-none");
  document.body.classList.remove("overflow-hidden");
};
