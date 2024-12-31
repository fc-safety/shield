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
import AssetDetailsForm from "./asset-details-form";

export default function NewAssetButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <AssetDetailsForm onSubmitted={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
