import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { InspectionRoute } from "~/lib/models";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {route ? <Pencil /> : <Plus />}
            {route ? "Edit" : "Add"} Route
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{route ? "Edit" : "Add New"} Route</DialogTitle>
        </DialogHeader>
        <RouteDetailsForm onSubmitted={() => setOpen(false)} route={route} />
      </DialogContent>
    </Dialog>
  );
}
