import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type {
  Asset,
  InspectionRoute,
  InspectionRoutePoint,
} from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import RoutePointDetailsForm from "./route-point-details-form";

interface EditRoutePointButtonProps {
  route?: InspectionRoute;
  asset?: Asset;
  routePoint?: InspectionRoutePoint;
  trigger?: React.ReactNode;
  filterRoute?: (route: InspectionRoute) => boolean;
}

export default function EditRoutePointButton({
  route,
  asset,
  routePoint,
  trigger,
  filterRoute,
}: EditRoutePointButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={routePoint ? "Edit Route Point" : "Add Route Point"}
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {routePoint ? <Pencil /> : <Plus />}
            {routePoint ? "Edit" : "Add"} Route Point
          </Button>
        )
      }
    >
      <RoutePointDetailsForm
        onSubmitted={() => setOpen(false)}
        route={route}
        asset={asset}
        routePoint={routePoint}
        filterRoute={filterRoute}
      />
    </ResponsiveDialog>
  );
}
