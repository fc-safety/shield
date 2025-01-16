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
import type { Client } from "~/lib/models";
import ClientDetailsForm from "./client-details-form";

interface EditClientButtonProps {
  client?: Client;
  trigger?: React.ReactElement;
}

export default function EditClientButton({
  client,
  trigger,
}: EditClientButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {client ? <Pencil /> : <Plus />}
            {client ? "Edit" : "Add"} Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit" : "Add New"} Client</DialogTitle>
        </DialogHeader>
        <ClientDetailsForm onSubmitted={() => setOpen(false)} client={client} />
      </DialogContent>
    </Dialog>
  );
}
