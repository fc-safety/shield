import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { AnsiCategory } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import AnsiCategoryDetailsForm from "./ansi-category-details-form";

interface EditAnsiCategoryButtonProps {
  ansiCategory?: AnsiCategory;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditAnsiCategoryButton({
  ansiCategory,
  trigger,
  open: openProp,
  onOpenChange,
}: EditAnsiCategoryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={openProp ?? open}
      onOpenChange={onOpenChange ?? setOpen}
      title={`${ansiCategory ? "Edit" : "Add New"} ANSI Category`}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {ansiCategory ? <Pencil /> : <Plus />}
            {ansiCategory ? "Edit" : "Add"} ANSI Category
          </Button>
        )
      }
    >
      <AnsiCategoryDetailsForm
        onSubmitted={() =>
          onOpenChange ? onOpenChange(false) : setOpen(false)
        }
        ansiCategory={ansiCategory}
      />
    </ResponsiveDialog>
  );
}
