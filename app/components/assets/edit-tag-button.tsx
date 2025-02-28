import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Tag } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import TagDetailsForm, { type TagDetailsFormProps } from "./tag-details-form";

interface EditTagButtonProps extends Omit<TagDetailsFormProps, "onClose"> {
  tag?: Tag;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditTagButton({
  tag,
  trigger,
  open: openProp,
  onOpenChange,
  ...passThroughProps
}: EditTagButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

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
      <TagDetailsForm
        onClose={() => setOpen(false)}
        tag={tag}
        {...passThroughProps}
      />
    </ResponsiveDialog>
  );
}
