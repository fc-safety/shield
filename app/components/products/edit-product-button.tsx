import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Product } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import ProductDetailsForm from "./product-details-form";

interface EditProductButtonProps {
  product?: Product;
  trigger?: React.ReactNode;
  canAssignOwnership?: boolean;
  parentProduct?: Product;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditProductButton({
  product,
  trigger,
  canAssignOwnership,
  parentProduct,
  open: openProp,
  onOpenChange,
}: EditProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      title={`${product ? "Edit" : "Add New"} ${
        parentProduct ? "Subproduct" : "Product"
      }`}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {product ? <Pencil /> : <Plus />}
            {product ? "Edit" : "Add"}{" "}
            {parentProduct ? "Subproduct" : "Product"}
          </Button>
        )
      }
    >
      <ProductDetailsForm
        onSubmitted={() =>
          onOpenChange ? onOpenChange(false) : setOpen(false)
        }
        product={product}
        canAssignOwnership={canAssignOwnership}
        parentProduct={parentProduct}
      />
    </ResponsiveDialog>
  );
}
