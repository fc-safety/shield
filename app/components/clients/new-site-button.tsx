import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import SiteDetailsForm from "./site-details-form";

interface NewSiteButtonProps {
  clientId: string;
}

export default function NewSiteButton({ clientId }: NewSiteButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus />
          Add Site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
        </DialogHeader>
        <SiteDetailsForm
          onSubmitted={() => setOpen(false)}
          clientId={clientId}
        />
      </DialogContent>
    </Dialog>
  );
}
