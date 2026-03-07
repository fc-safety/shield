import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import ManufacturerDetailsForm from "./manufacturer-details-form";

interface EditManufacturerButtonProps extends React.ComponentProps<typeof ManufacturerDetailsForm> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditManufacturerButton({
  manufacturer,
  trigger,
  onSubmitted,
  open: openProp,
  onOpenChange,
  ...passThroughProps
}: EditManufacturerButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveModal
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      isNested
    >
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {manufacturer ? <Pencil /> : <Plus />}
            {manufacturer ? "Edit" : "Add"} Manufacturer
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {manufacturer ? "Edit Manufacturer" : "Add New Manufacturer"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ManufacturerDetailsForm
          onSubmitted={() => {
            onOpenChange ? onOpenChange(false) : setOpen(false);
            onSubmitted?.();
          }}
          manufacturer={manufacturer}
          {...passThroughProps}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
