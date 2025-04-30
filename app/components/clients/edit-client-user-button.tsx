import { Pencil, Plus } from "lucide-react";
import { useState, type ComponentProps } from "react";
import type { ClientUser } from "~/lib/types";
import { ResponsiveDialog } from "../responsive-dialog";
import { Button } from "../ui/button";
import ClientUserDetailsForm from "./client-user-details-form";
interface EditUserButtonProps
  extends Omit<ComponentProps<typeof ClientUserDetailsForm>, "onSubmitted"> {
  user?: ClientUser;
  trigger?: React.ReactNode;
}

export default function EditUserButton({
  user,
  trigger,
  ...props
}: EditUserButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={user ? "Edit User" : "Add New User"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
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
        {...props}
      />
    </ResponsiveDialog>
  );
}
