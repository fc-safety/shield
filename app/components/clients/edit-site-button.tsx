import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { type ReactNode } from "react";
import { useDialogState } from "~/hooks/use-dialog-state";
import type { Site } from "~/lib/models";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "../responsive-modal";
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
    <ResponsiveModal open={open} onOpenChange={setOpen} isNested>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            {site ? <Pencil /> : <Plus />}
            {site ? "Edit" : "Add"} Site {isSiteGroup ? "Group" : ""}
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-lg" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {site ? "Edit Site" : "Add New Site"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <SiteDetailsForm
          onSubmitted={() => setOpen(false)}
          site={site}
          isSiteGroup={isSiteGroup}
          {...passThroughProps}
        />
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
