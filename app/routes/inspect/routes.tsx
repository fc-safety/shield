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
import {
  ArrowDown,
  ArrowUp,
  Bot,
  GripVertical,
  Pencil,
  Plus,
  Trash,
} from "lucide-react";
import { forwardRef, useEffect, useState, type HTMLAttributes } from "react";
import { useFetcher, type FetcherWithComponents } from "react-router";
import { useImmer } from "use-immer";
import { api } from "~/.server/api";
import ConfirmationDialog from "~/components/confirmation-dialog";
import GradientScrollArea from "~/components/gradient-scroll-area";
import {
  HelpSidebarContent,
  HelpSidebarSection,
} from "~/components/help-sidebar";
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
import useConfirmAction from "~/hooks/use-confirm-action";
import type { InspectionRoute, InspectionRoutePoint } from "~/lib/models";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/routes";

export const loader = async ({ request }: Route.LoaderArgs) => {
  return api.inspectionRoutes.list(request);
};

export default function InspectionRoutes({
  loaderData: routes,
}: Route.ComponentProps) {
  return (
    <div className="grid gap-4 text-center">
      <div className="grid gap-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          Inspection Routes
        </h2>
        <p className="text-sm text-muted-foreground">
          Build routes to help your inspectors find your assets and ensure
          inspections get completed if the task gets picked up again on a
          different day or even by a different inspector.
        </p>
      </div>
      <EditRouteButton />
      {routes.results.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}
    </div>
  );
}

function RouteCard({ route }: { route: InspectionRoute }) {
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

  const [points, setPoints] = useImmer<InspectionRoutePoint[]>([]);

  const [activePoint, setActivePoint] = useState<{
    point: InspectionRoutePoint;
    idx: number;
  } | null>(null);

  useEffect(() => {
    setPoints(
      route.inspectionRoutePoints?.slice().sort((a, b) => a.order - b.order) ??
        []
    );
  }, [setPoints, route.inspectionRoutePoints]);

  const reorderFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const [deleteAction, setDeleteAction] = useConfirmAction({
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

  const handleDelete = (routePoint: InspectionRoutePoint) => {
    setDeleteAction((draft) => {
      draft.open = true;
      draft.message = `Are you sure you want to remove "${routePoint.asset?.name}" from this route?`;
      draft.onConfirm = () => {
        deleteFetcher.submit(
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
      <Card className="text-start">
        <CardHeader className="flex-row justify-between">
          <CardHeader className="p-0 sm:p-0">
            <CardTitle>{route.name}</CardTitle>
            <CardDescription>
              {route.description || <>&mdash;</>}
            </CardDescription>
          </CardHeader>
          <EditRouteButton
            route={route}
            trigger={
              <Button size="icon" variant="secondary">
                <Pencil />
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-semibold flex items-center gap-2">
              Route Points
              <HelpbarTrigger
                content={
                  <HelpSidebarContent>
                    <HelpSidebarSection
                      title="Adding Route Points"
                      content="You can add route points by clicking the 'Manually Add Point' button or by scanning the NFC tag on the asset and adding the asset to a route via the inspection page."
                    />
                  </HelpSidebarContent>
                }
              />
            </h3>
            {!points ||
              (points.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No route points added yet.
                </div>
              ))}
            {points && (
              <GradientScrollArea
                className="max-h-72 h-full"
                variant="card"
                scrollDisabled={!!activePoint}
              >
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
                          idx={idx}
                          allPoints={points}
                          reorderFetcher={reorderFetcher}
                          deleteFetcher={deleteFetcher}
                          handleReorder={handleReorder}
                          handleDelete={handleDelete}
                          className={cn(
                            activePoint &&
                              activePoint.idx === idx &&
                              "opacity-50 pointer-events-none"
                          )}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activePoint ? (
                      <RoutePointItem
                        point={activePoint.point}
                        idx={activePoint.idx}
                        allPoints={points}
                        reorderFetcher={reorderFetcher}
                        deleteFetcher={deleteFetcher}
                        handleReorder={handleReorder}
                        handleDelete={handleDelete}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </GradientScrollArea>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button size="sm">
            <Bot />
            Start Route Assistant
          </Button>
          <EditRoutePointButton
            route={route}
            trigger={
              <Button size="sm" variant="outline">
                <Plus />
                Manually Add Point
              </Button>
            }
          />
        </CardFooter>
      </Card>
      <ConfirmationDialog {...deleteAction} />
    </>
  );
}

const disableBodyScroll = () => {
  document.body.classList.add("touch-none");
  document.body.classList.add("overflow-hidden");
};

const enableBodyScroll = () => {
  document.body.classList.remove("touch-none");
  document.body.classList.remove("overflow-hidden");
};

const SortableRoutePointItem = (props: RoutePointItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.point.id });

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
    <RoutePointItem
      {...props}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
    />
  );
};

interface RoutePointItemProps extends HTMLAttributes<HTMLDivElement> {
  point: InspectionRoutePoint;
  allPoints: InspectionRoutePoint[];
  idx: number;
  reorderFetcher: FetcherWithComponents<unknown>;
  deleteFetcher: FetcherWithComponents<unknown>;
  handleReorder: (id: string, order: number) => void;
  handleDelete: (point: InspectionRoutePoint) => void;
}

const RoutePointItem = forwardRef<HTMLDivElement, RoutePointItemProps>(
  (
    {
      point,
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
          "flex gap-3 items-center bg-card rounded-md p-2 -mx-2",
          className
        )}
      >
        <div {...props} style={{ touchAction: "manipulation" }}>
          <GripVertical className="size-4" />
        </div>
        <div className="text-xs font-semibold rounded-full size-7 shrink-0 flex items-center justify-center bg-primary text-primary-foreground">
          {idx + 1}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-semibold">{point.asset?.name}</div>
          <div className="text-xs text-muted-foreground">
            {point.asset?.location} - {point.asset?.placement}
          </div>
        </div>
        <div className="flex-1"></div>
        <div className="flex gap-0.5">
          <Button
            size="icon"
            variant="secondary"
            disabled={
              !allPoints ||
              idx === allPoints.length - 1 ||
              reorderFetcher.state !== "idle"
            }
            onClick={() => handleReorder(point.id, getNextOrder(idx))}
          >
            <ArrowDown />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            disabled={idx === 0 || reorderFetcher.state !== "idle"}
            onClick={() => handleReorder(point.id, getPreviousOrder(idx))}
          >
            <ArrowUp />
          </Button>
        </div>
        <Button
          size="icon"
          variant="destructive"
          disabled={deleteFetcher.state !== "idle"}
          onClick={() => handleDelete(point)}
          className="shrink-0"
        >
          <Trash />
        </Button>
      </div>
    );
  }
);

RoutePointItem.displayName = "RoutePointItem";
