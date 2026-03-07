import { WandSparkles } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "~/components/responsive-modal";
import { Button } from "~/components/ui/button";
import MigrationAssistant from "./migration-assistant";

interface Props extends ComponentProps<typeof MigrationAssistant> {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function MigrationAssistantButton({
  trigger,
  open: openProp,
  onOpenChange,
  ...props
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <ResponsiveModal open={open} onOpenChange={setOpen}>
      <ResponsiveModalTrigger>
        {trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            <WandSparkles /> Migration Assistant
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-2xl" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            <div className="flex items-center gap-2">
              <WandSparkles className="size-4" /> Migration Assistant
            </div>
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Use this assistant to guide you through the process of migrating clients from the legacy system.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <ResponsiveModalBody>
          <div className="h-144">
            <MigrationAssistant {...props} />
          </div>
        </ResponsiveModalBody>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
