import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import ProductCategoryDetailsForm from "./product-category-details-form";

interface EditProductCategoryButtonProps
  extends React.ComponentProps<typeof ProductCategoryDetailsForm> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditProductCategoryButton({
  productCategory,
  trigger,
  onSubmitted,
  open: openProp,
  onOpenChange,
  ...passThroughProps
}: EditProductCategoryButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveModal
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      isNested
    >
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {productCategory ? <Pencil /> : <Plus />}
            {productCategory ? "Edit" : "Add"} Category
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {productCategory ? "Edit Category" : "Add New Category"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ProductCategoryDetailsForm
          onSubmitted={() => {
            onOpenChange ? onOpenChange(false) : setOpen(false);
            onSubmitted?.();
          }}
          productCategory={productCategory}
          {...passThroughProps}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
