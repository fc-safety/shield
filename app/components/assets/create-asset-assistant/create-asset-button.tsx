import { ShieldPlus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { ViewContext } from "~/.server/api-utils";
import { ResponsiveDialog } from "~/components/responsive-dialog";
import { Button } from "~/components/ui/button";
import CreateAssetAssistant from "./create-asset-assistant.component";

interface Props {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  clientId?: string;
  siteId?: string;
  viewContext?: ViewContext;
  nestDrawers?: boolean;
}

export default function CreateAssetButton({
  trigger,
  open: openProp,
  onOpenChange,
  clientId,
  siteId,
  viewContext,
  nestDrawers,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={
        <div className="flex items-center gap-1">
          <ShieldPlus className="size-5" /> Adding new asset...
        </div>
      }
      description=""
      dialogClassName="sm:max-w-2xl"
      disableScrollArea
      trigger={
        trigger !== undefined ? (
          trigger
        ) : (
          <Button type="button" size="sm">
            <ShieldPlus /> Add Asset
          </Button>
        )
      }
      render={({ drawerContentHeight }) => (
        <div className="overflow-hidden" style={{ height: drawerContentHeight ?? "32rem" }}>
          <CreateAssetAssistant
            onClose={() => setOpen(false)}
            state={{ assetData: { clientId, siteId } }}
            viewContext={viewContext}
          />
        </div>
      )}
      isNestedDrawer={nestDrawers}
    />
  );
}
