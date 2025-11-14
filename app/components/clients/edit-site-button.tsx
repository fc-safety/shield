import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { type ReactNode } from "react";
import { useDialogState } from "~/hooks/use-dialog-state";
import type { Site } from "~/lib/models";
import { ResponsiveDialog } from "../responsive-dialog";
import SiteDetailsForm, { type SiteDetailsFormProps } from "./site-details-form";

interface NewSiteButtonProps extends Omit<SiteDetailsFormProps, "onSubmitted"> {
  site?: Site;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditSiteButton({
  site,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  trigger,
  isSiteGroup,
  ...passThroughProps
}: NewSiteButtonProps) {
  const { open, setOpen } = useDialogState({
    open: openProp,
    onOpenChange: onOpenChangeProp,
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={site ? "Edit Site" : "Add New Site"}
      dialogClassName="sm:max-w-lg"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {site ? <Pencil /> : <Plus />}
            {site ? "Edit" : "Add"} Site {isSiteGroup ? "Group" : ""}
          </Button>
        )
      }
    >
      <SiteDetailsForm
        onSubmitted={() => setOpen(false)}
        site={site}
        isSiteGroup={isSiteGroup}
        {...passThroughProps}
      />
    </ResponsiveDialog>
  );
}
