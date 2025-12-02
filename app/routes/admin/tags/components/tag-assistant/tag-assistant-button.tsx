import { WandSparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ResponsiveDialog } from "~/components/responsive-dialog";
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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={
        <div className="flex items-center gap-1">
          <WandSparkles className="size-5" /> Tag Assistant
        </div>
      }
      description="Use this assistant to guide you through the process of programming new tags."
      dialogClassName="sm:max-w-2xl"
      disableScrollArea
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            <WandSparkles /> Tag Assistant
          </Button>
        )
      }
      render={({ drawerContentHeight }) => (
        <div className="overflow-hidden" style={{ height: drawerContentHeight ?? "32rem" }}>
          <TagAssistant onClose={() => setOpen(false)} />
        </div>
      )}
    />
  );
}
