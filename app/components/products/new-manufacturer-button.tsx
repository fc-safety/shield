import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import ManufacturerDetailsForm from "./manufacturer-details-form";

export default function NewProductCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus />
          Add Manufacturer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Manufacturer</DialogTitle>
        </DialogHeader>
        <ManufacturerDetailsForm onSubmitted={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
