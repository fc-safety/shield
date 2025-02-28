import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { InspectionRoutePoint } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import RoutePointDetailsForm, {
  type RoutePointDetailsFormProps,
} from "./route-point-details-form";

interface EditRoutePointButtonProps
  extends Omit<RoutePointDetailsFormProps, "onSubmitted"> {
  routePoint?: InspectionRoutePoint;
  trigger?: React.ReactNode;
}

export default function EditRoutePointButton({
  routePoint,
  trigger,
  ...passThroughProps
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
        routePoint={routePoint}
        {...passThroughProps}
      />
    </ResponsiveDialog>
  );
}
