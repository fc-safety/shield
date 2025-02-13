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
import type { Consumable } from "~/lib/models";
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
    <Dialog open={openProp ?? open} onOpenChange={onOpenChange ?? setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {consumable ? <Pencil /> : <Plus />}
            {consumable ? "Edit" : "Add"} Consumable
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {consumable ? "Edit" : "Add New"} Consumable
          </DialogTitle>
        </DialogHeader>
        <ConsumableDetailsForm
          onSubmitted={() =>
            onOpenChange ? onOpenChange(false) : setOpen(false)
          }
          consumable={consumable}
          assetId={assetId}
          parentProductId={parentProductId}
        />
      </DialogContent>
    </Dialog>
  );
}
