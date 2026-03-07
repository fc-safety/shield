import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { InspectionRoutePoint } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
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
    <ResponsiveModal open={open} onOpenChange={setOpen} isNested>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {routePoint ? <Pencil /> : <Plus />}
            {routePoint ? "Edit" : "Add"} Route Point
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {routePoint ? "Edit Route Point" : "Add Route Point"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <RoutePointDetailsForm
          onSubmitted={() => setOpen(false)}
          routePoint={routePoint}
          {...passThroughProps}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
