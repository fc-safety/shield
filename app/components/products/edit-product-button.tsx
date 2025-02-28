import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "../responsive-dialog";
import ProductDetailsForm, {
  type ProductDetailsFormProps,
} from "./product-details-form";

interface EditProductButtonProps
  extends Omit<ProductDetailsFormProps, "onSubmitted"> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditProductButton({
  product,
  trigger,
  parentProduct,
  consumable,
  open: openProp,
  onOpenChange,
  ...passThroughProps
}: EditProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      title={`${product ? "Edit" : "Add New"} ${
        consumable || parentProduct ? "Subproduct" : "Product"
      }`}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {product ? <Pencil /> : <Plus />}
            {product ? "Edit" : "Add"}{" "}
            {consumable || parentProduct ? "Subproduct" : "Product"}
          </Button>
        )
      }
    >
      <ProductDetailsForm
        onSubmitted={() =>
          onOpenChange ? onOpenChange(false) : setOpen(false)
        }
        product={product}
        parentProduct={parentProduct}
        consumable={consumable}
        {...passThroughProps}
      />
    </ResponsiveDialog>
  );
}
