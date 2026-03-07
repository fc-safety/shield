import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Client } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import ClientDetailsForm from "./client-details-form";

interface EditClientButtonProps extends React.ComponentProps<typeof ClientDetailsForm> {
  client?: Client;
  trigger?: React.ReactElement;
}

export default function EditClientButton({ client, trigger, ...props }: EditClientButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveModal open={open} onOpenChange={setOpen} isNested>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {client ? <Pencil /> : <Plus />}
            {client ? "Edit" : "Add"} Client
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {client ? "Edit Client" : "Add New Client"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ClientDetailsForm onSubmitted={() => setOpen(false)} client={client} {...props} />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
