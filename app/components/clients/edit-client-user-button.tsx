import { Pencil, Plus } from "lucide-react";
import { useState, type ComponentProps } from "react";
import type { UserResponse } from "~/lib/types";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
import { Button } from "../ui/button";
import ClientUserDetailsForm from "./client-user-details-form";
interface EditUserButtonProps
  extends Omit<ComponentProps<typeof ClientUserDetailsForm>, "onSubmitted"> {
  user?: UserResponse;
  trigger?: React.ReactNode;
}

export default function EditUserButton({ user, trigger, ...props }: EditUserButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <ResponsiveModal open={open} onOpenChange={setOpen} isNested>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {user ? <Pencil /> : <Plus />}
            {user ? "Edit" : "Add"} User
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {user ? "Edit User" : "Add New User"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ClientUserDetailsForm onSubmitted={() => setOpen(false)} user={user} {...props} />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
