import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import type { Role } from "~/lib/types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import RoleDetailsForm from "./role-details-form";

interface EditRoleButtonProps {
  role?: Role;
  trigger?: React.ReactNode;
}

export default function EditRoleButton({ role, trigger }: EditRoleButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            {role ? <Pencil /> : <Plus />}
            {role ? "Edit" : "Add"} Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Edit" : "Add New"} Role</DialogTitle>
        </DialogHeader>
        <RoleDetailsForm onSubmitted={() => setOpen(false)} role={role} />
      </DialogContent>
    </Dialog>
  );
}
