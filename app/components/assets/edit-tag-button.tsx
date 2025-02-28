import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Tag } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import TagDetailsForm from "./tag-details-form";

interface EditTagButtonProps {
  tag?: Tag;
  trigger?: React.ReactNode;
}

export default function EditTagButton({ tag, trigger }: EditTagButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={tag ? "Edit Tag" : "Add New Tag"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {tag ? <Pencil /> : <Plus />}
            {tag ? "Edit" : "Add"} Tag
          </Button>
        )
      }
    >
      <TagDetailsForm onClose={() => setOpen(false)} tag={tag} />
    </ResponsiveDialog>
  );
}
