import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState, type ComponentProps } from "react";
import type { Asset } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
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
    <ResponsiveModal
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      isNested={nestDrawers}
    >
      <ResponsiveModalTrigger className={className}>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {asset ? <Pencil /> : <Plus />}
            {asset ? "Edit" : "Add"} Asset
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {asset ? "Edit Asset" : "Add New Asset"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <AssetDetailsForm
          onSubmitted={() => (onOpenChange ? onOpenChange(false) : setOpen(false))}
          asset={asset}
          nestDrawers
          {...props}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
