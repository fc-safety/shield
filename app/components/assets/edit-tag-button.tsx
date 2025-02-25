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
import type { Tag } from "~/lib/models";
import TagDetailsForm from "./tag-details-form";

interface EditTagButtonProps {
  tag?: Tag;
  trigger?: React.ReactNode;
}

export default function EditTagButton({ tag, trigger }: EditTagButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {tag ? <Pencil /> : <Plus />}
            {tag ? "Edit" : "Add"} Tag
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? "Edit" : "Add New"} Tag</DialogTitle>
        </DialogHeader>
        <TagDetailsForm onClose={() => setOpen(false)} tag={tag} />
      </DialogContent>
    </Dialog>
  );
}
