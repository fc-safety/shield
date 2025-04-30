import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { InspectionRoute } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import RouteDetailsForm from "./route-details-form";

interface EditRouteButtonProps {
  route?: InspectionRoute;
  trigger?: React.ReactNode;
}

export default function EditRouteButton({
  route,
  trigger,
}: EditRouteButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={route ? "Edit Route" : "Add New Route"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {route ? <Pencil /> : <Plus />}
            {route ? "Edit" : "Add"} Route
          </Button>
        )
      }
    >
      <RouteDetailsForm onSubmitted={() => setOpen(false)} route={route} />
    </ResponsiveDialog>
  );
}
