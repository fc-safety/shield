import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { ClientUser } from "~/lib/types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ClientUserDetailsForm from "./client-user-details-form";

interface EditUserButtonProps {
  user?: ClientUser;
  trigger?: React.ReactNode;
  clientId: string;
  siteExternalId?: string;
}

export default function EditUserButton({
  user,
  trigger,
  clientId,
  siteExternalId,
}: EditUserButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {user ? <Pencil /> : <Plus />}
            {user ? "Edit" : "Add"} User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit" : "Add New"} User</DialogTitle>
        </DialogHeader>
        <ClientUserDetailsForm
          onSubmitted={() => setOpen(false)}
          user={user}
          clientId={clientId}
          siteExternalId={siteExternalId}
        />
      </DialogContent>
    </Dialog>
  );
}
