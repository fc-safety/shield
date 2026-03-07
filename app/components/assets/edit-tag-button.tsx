import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import React, { useState, type ComponentProps } from "react";
import type { Tag } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import TagDetailsForm from "./tag-details-form";

interface EditTagButtonProps
  extends Omit<ComponentProps<typeof TagDetailsForm>, "onClose"> {
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
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      isNested
    >
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {tag ? <Pencil /> : <Plus />}
            {tag ? "Edit" : "Add"} Tag
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {tag ? "Edit Tag" : "Add New Tag"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <TagDetailsForm
          onClose={() => setOpen(false)}
          tag={tag}
          {...passThroughProps}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
