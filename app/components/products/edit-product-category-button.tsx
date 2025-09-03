import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { ResponsiveDialog } from "../responsive-dialog";
import ProductCategoryDetailsForm from "./product-category-details-form";

interface EditProductCategoryButtonProps
  extends React.ComponentProps<typeof ProductCategoryDetailsForm> {
  trigger?: React.ReactNode;
}

export default function EditProductCategoryButton({
  productCategory,
  trigger,
  ...passThroughProps
}: EditProductCategoryButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={productCategory ? "Edit Category" : "Add New Category"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {productCategory ? <Pencil /> : <Plus />}
            {productCategory ? "Edit" : "Add"} Category
          </Button>
        )
      }
    >
      <ProductCategoryDetailsForm
        onSubmitted={() => setOpen(false)}
        productCategory={productCategory}
        {...passThroughProps}
      />
    </ResponsiveDialog>
  );
}
