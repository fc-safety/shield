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
import type { ProductCategory } from "~/lib/models";
import ProductCategoryDetailsForm from "./product-category-details-form";

interface EditProductCategoryButtonProps {
  productCategory?: ProductCategory;
  trigger?: React.ReactNode;
}

export default function EditProductCategoryButton({
  productCategory,
  trigger,
}: EditProductCategoryButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {productCategory ? <Pencil /> : <Plus />}
            {productCategory ? "Edit" : "Add"} Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {productCategory ? "Edit" : "Add New"} Category
          </DialogTitle>
        </DialogHeader>
        <ProductCategoryDetailsForm
          onSubmitted={() => setOpen(false)}
          productCategory={productCategory}
        />
      </DialogContent>
    </Dialog>
  );
}
