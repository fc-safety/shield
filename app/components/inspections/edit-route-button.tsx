import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { InspectionRoute } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
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
    <ResponsiveModal open={open} onOpenChange={setOpen} isNested>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {route ? <Pencil /> : <Plus />}
            {route ? "Edit" : "Add"} Route
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {route ? "Edit Route" : "Add New Route"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <RouteDetailsForm onSubmitted={() => setOpen(false)} route={route} />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
