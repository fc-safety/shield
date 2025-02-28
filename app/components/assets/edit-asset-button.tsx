import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Asset } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={asset ? "Edit Asset" : "Add New Asset"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {asset ? <Pencil /> : <Plus />}
            {asset ? "Edit" : "Add"} Asset
          </Button>
        )
      }
    >
      <AssetDetailsForm onSubmitted={() => setOpen(false)} asset={asset} />
    </ResponsiveDialog>
  );
}
