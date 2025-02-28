import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { ClientUser } from "~/lib/types";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={user ? "Edit User" : "Add New User"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button type="button" size="sm">
            {user ? <Pencil /> : <Plus />}
            {user ? "Edit" : "Add"} User
          </Button>
        )
      }
    >
      <ClientUserDetailsForm
        onSubmitted={() => setOpen(false)}
        user={user}
        clientId={clientId}
        siteExternalId={siteExternalId}
      />
    </ResponsiveDialog>
  );
}
