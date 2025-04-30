import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Manufacturer } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={manufacturer ? "Edit Manufacturer" : "Add New Manufacturer"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {manufacturer ? <Pencil /> : <Plus />}
            {manufacturer ? "Edit" : "Add"} Manufacturer
          </Button>
        )
      }
    >
      <ManufacturerDetailsForm
        onSubmitted={() => setOpen(false)}
        manufacturer={manufacturer}
      />
    </ResponsiveDialog>
  );
}
