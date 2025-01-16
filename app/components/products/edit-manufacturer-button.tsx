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
import type { Manufacturer } from "~/lib/models";
import ManufacturerDetailsForm from "./manufacturer-details-form";

interface EditManufacturerButtonProps {
  manufacturer?: Manufacturer;
  trigger?: React.ReactNode;
}

export default function EditManufacturerButton({
  manufacturer,
  trigger,
}: EditManufacturerButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {manufacturer ? <Pencil /> : <Plus />}
            {manufacturer ? "Edit" : "Add"} Manufacturer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {manufacturer ? "Edit" : "Add New"} Manufacturer
          </DialogTitle>
        </DialogHeader>
        <ManufacturerDetailsForm
          onSubmitted={() => setOpen(false)}
          manufacturer={manufacturer}
        />
      </DialogContent>
    </Dialog>
  );
}
