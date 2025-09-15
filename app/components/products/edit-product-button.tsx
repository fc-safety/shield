import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "../responsive-dialog";
import ProductDetailsForm, { type ProductDetailsFormProps } from "./product-details-form";

interface EditProductButtonProps extends Omit<ProductDetailsFormProps, "onSubmitted"> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  nestDrawers?: boolean;
}

export default function EditProductButton({
  product,
  trigger,
  parentProduct,
  consumable,
  open: openProp,
  onOpenChange,
  nestDrawers,
  ...passThroughProps
}: EditProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      title={`${product ? "Edit" : "Add New"} ${
        consumable || parentProduct ? "Supply" : "Product"
      }`}
      dialogClassName="sm:max-w-lg"
      isNestedDrawer={nestDrawers}
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {product ? <Pencil /> : <Plus />}
            {product ? "Edit" : "Add"} {consumable || parentProduct ? "Supply" : "Product"}
          </Button>
        )
      }
    >
      <ProductDetailsForm
        onSubmitted={() => (onOpenChange ? onOpenChange(false) : setOpen(false))}
        product={product}
        parentProduct={parentProduct}
        consumable={consumable}
        {...passThroughProps}
      />
    </ResponsiveDialog>
  );
}
