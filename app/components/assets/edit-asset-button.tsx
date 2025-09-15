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
  className?: string;
  nestDrawers?: boolean;
}

export default function EditAssetButton({
  asset,
  trigger,
  open: openProp,
  onOpenChange,
  className,
  nestDrawers,
  ...props
}: EditAssetButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      title={asset ? "Edit Asset" : "Add New Asset"}
      dialogClassName="sm:max-w-lg"
      classNames={{
        trigger: className,
      }}
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {asset ? <Pencil /> : <Plus />}
            {asset ? "Edit" : "Add"} Asset
          </Button>
        )
      }
      isNestedDrawer={nestDrawers}
    >
      <AssetDetailsForm
        onSubmitted={() => (onOpenChange ? onOpenChange(false) : setOpen(false))}
        asset={asset}
        nestDrawers
        {...props}
      />
    </ResponsiveDialog>
  );
}
