import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { AnsiCategory } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
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
    <ResponsiveModal open={openProp ?? open} onOpenChange={onOpenChange ?? setOpen}>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {ansiCategory ? <Pencil /> : <Plus />}
            {ansiCategory ? "Edit" : "Add"} ANSI Category
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {`${ansiCategory ? "Edit" : "Add New"} ANSI Category`}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <AnsiCategoryDetailsForm
          onSubmitted={() => (onOpenChange ? onOpenChange(false) : setOpen(false))}
          ansiCategory={ansiCategory}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
