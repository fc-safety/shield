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
import type { Product } from "~/lib/models";
import ProductDetailsForm from "./product-details-form";

interface EditProductButtonProps {
  product?: Product;
  trigger?: React.ReactNode;
  canAssignOwnership?: boolean;
  parentProduct?: Product;
}

export default function EditProductButton({
  product,
  trigger,
  canAssignOwnership,
  parentProduct,
}: EditProductButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {product ? <Pencil /> : <Plus />}
            {product ? "Edit" : "Add"}{" "}
            {parentProduct ? "Subproduct" : "Product"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit" : "Add New"}{" "}
            {parentProduct ? "Subproduct" : "Product"}
          </DialogTitle>
        </DialogHeader>
        <ProductDetailsForm
          onSubmitted={() => setOpen(false)}
          product={product}
          canAssignOwnership={canAssignOwnership}
          parentProduct={parentProduct}
        />
      </DialogContent>
    </Dialog>
  );
}
