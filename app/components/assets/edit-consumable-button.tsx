import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Consumable } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import ConsumableDetailsForm from "./consumable-details-form";

interface EditConsumableButtonProps {
  consumable?: Consumable;
  trigger?: React.ReactNode;
  assetId: string;
  parentProductId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditConsumableButton({
  consumable,
  trigger,
  assetId,
  parentProductId,
  open: openProp,
  onOpenChange,
}: EditConsumableButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      title={consumable ? "Edit Supply" : "Add New Supply"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {consumable ? <Pencil /> : <Plus />}
            {consumable ? "Edit" : "Add"} Supply
          </Button>
        )
      }
    >
      <ConsumableDetailsForm
        onSubmitted={() =>
          onOpenChange ? onOpenChange(false) : setOpen(false)
        }
        consumable={consumable}
        assetId={assetId}
        parentProductId={parentProductId}
      />
    </ResponsiveDialog>
  );
}
