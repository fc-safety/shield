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
import type { Asset } from "~/lib/models";
import AssetDetailsForm from "./asset-details-form";

interface EditAssetButtonProps {
  asset?: Asset;
  trigger?: React.ReactNode;
}

export default function EditAssetButton({
  asset,
  trigger,
}: EditAssetButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {asset ? <Pencil /> : <Plus />}
            {asset ? "Edit" : "Add"} Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asset ? "Edit" : "Add New"} Asset</DialogTitle>
        </DialogHeader>
        <AssetDetailsForm onSubmitted={() => setOpen(false)} asset={asset} />
      </DialogContent>
    </Dialog>
  );
}
