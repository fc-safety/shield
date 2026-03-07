import { WandSparkles } from "lucide-react";
import type { ReactNode } from "react";
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
import { TagAssistant } from "./tag-assistant";

interface Props {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function TagAssistantButton({ trigger, open: openProp, onOpenChange }: Props) {
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
            <WandSparkles /> Tag Assistant
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent classNames={{ dialog: "sm:max-w-2xl" }}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            <div className="flex items-center gap-1">
              <WandSparkles className="size-5" /> Tag Assistant
            </div>
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Use this assistant to guide you through the process of programming new tags.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <ResponsiveModalBody disableScrollArea>
          <div className="flex-1 min-h-0 overflow-hidden">
            <TagAssistant onClose={() => setOpen(false)} />
          </div>
        </ResponsiveModalBody>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
