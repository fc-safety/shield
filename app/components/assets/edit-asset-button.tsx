import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState, type ComponentProps } from "react";
import type { Asset } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import AssetDetailsForm from "./asset-details-form";

interface EditAssetButtonProps extends ComponentProps<typeof AssetDetailsForm> {
  asset?: Asset;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditAssetButton({
  asset,
  trigger,
  open: openProp,
  onOpenChange,
  ...props
}: EditAssetButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
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
      <AssetDetailsForm
        onSubmitted={() =>
          onOpenChange ? onOpenChange(false) : setOpen(false)
        }
        asset={asset}
        {...props}
      />
    </ResponsiveDialog>
  );
}
