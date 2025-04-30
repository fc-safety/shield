import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Client } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={client ? "Edit Client" : "Add New Client"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {client ? <Pencil /> : <Plus />}
            {client ? "Edit" : "Add"} Client
          </Button>
        )
      }
    >
      <ClientDetailsForm onSubmitted={() => setOpen(false)} client={client} />
    </ResponsiveDialog>
  );
}
