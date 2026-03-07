import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Consumable } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import ConsumableDetailsForm from "./consumable-details-form";

interface EditConsumableButtonProps {
  consumable?: Consumable;
  trigger?: React.ReactNode;
  assetId: string;
  parentProductId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  nestDrawers?: boolean;
}

export default function EditConsumableButton({
  consumable,
  trigger,
  assetId,
  parentProductId,
  open: openProp,
  onOpenChange,
  nestDrawers,
}: EditConsumableButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveModal
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      isNested={nestDrawers}
    >
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {consumable ? <Pencil /> : <Plus />}
            {consumable ? "Edit" : "Add"} Supply
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {consumable ? "Edit Supply" : "Add New Supply"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ConsumableDetailsForm
          onSubmitted={() => (onOpenChange ? onOpenChange(false) : setOpen(false))}
          consumable={consumable}
          assetId={assetId}
          parentProductId={parentProductId}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
