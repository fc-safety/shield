import { WandSparkles } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { ResponsiveDialog } from "~/components/responsive-dialog";
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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={
        <div className="flex items-center gap-2">
          <WandSparkles className="size-4" /> Migration Assistant
        </div>
      }
      description="Use this assistant to guide you through the process of migrating clients from the legacy system."
      dialogClassName="sm:max-w-2xl"
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            <WandSparkles /> Migration Assistant
          </Button>
        )
      }
    >
      <div className="h-[36rem]">
        <MigrationAssistant {...props} />
      </div>
    </ResponsiveDialog>
  );
}
