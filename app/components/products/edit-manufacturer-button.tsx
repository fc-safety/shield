import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "../responsive-dialog";
import ManufacturerDetailsForm from "./manufacturer-details-form";

interface EditManufacturerButtonProps extends React.ComponentProps<typeof ManufacturerDetailsForm> {
  trigger?: React.ReactNode;
}

export default function EditManufacturerButton({
  manufacturer,
  trigger,
  ...passThroughProps
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
        {...passThroughProps}
      />
    </ResponsiveDialog>
  );
}
