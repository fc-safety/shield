import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Site } from "~/lib/models";
import SiteDetailsForm from "./site-details-form";

interface NewSiteButtonProps {
  clientId: string;
  site?: Site;
  trigger?: ReactNode;
}

export default function EditSiteButton({
  clientId,
  site,
  trigger,
}: NewSiteButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {site ? <Pencil /> : <Plus />}
            {site ? "Edit" : "Add"} Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{site ? "Edit" : "Add New"} Site</DialogTitle>
        </DialogHeader>
        <SiteDetailsForm
          onSubmitted={() => setOpen(false)}
          clientId={clientId}
          site={site}
        />
      </DialogContent>
    </Dialog>
  );
}
