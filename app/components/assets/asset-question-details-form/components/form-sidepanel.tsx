import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";
import { Drawer, DrawerContent } from "~/components/ui/drawer";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useAssetQuestionDetailFormContext } from "../asset-question-detail-form.context";
import { AlertTriggerConfigurator } from "./sidepanel-inserts/alert-trigger-configurator";
import { AutoSetupSupplyConfigurator } from "./sidepanel-inserts/auto-setup-supply-configurator";
import { ConditionConfigurator } from "./sidepanel-inserts/condition-configurator";
import FileConfigurator from "./sidepanel-inserts/file-configurator";

export default function FormSidepanel({ minWidth = "768px" }: { minWidth?: string }) {
  const isDesktop = useMediaQuery(`(min-width: ${minWidth})`);

  const { sidepanelId, closeSidepanel } = useAssetQuestionDetailFormContext();

  if (isDesktop) {
    return (
      <AnimatePresence>
        {sidepanelId && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "22rem" }}
            exit={{ width: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
              type: "tween",
            }}
            className="border-border shrink-0 overflow-hidden border-l p-4"
          >
            <FormSidepanelContent />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Drawer open={!!sidepanelId} onOpenChange={(open) => !open && closeSidepanel()}>
      <DrawerContent className={cn("max-w-[100vw]")}>
        <ScrollArea
          classNames={{
            root: "h-[calc(100vh-5rem)]",
          }}
        >
          <div className="w-full px-4">
            <FormSidepanelContent />
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

function FormSidepanelContent() {
  const { sidepanelId } = useAssetQuestionDetailFormContext();

  switch (sidepanelId) {
    case AutoSetupSupplyConfigurator.Id:
      return <AutoSetupSupplyConfigurator />;
    case AlertTriggerConfigurator.Id:
      return <AlertTriggerConfigurator />;
    case ConditionConfigurator.Id:
      return <ConditionConfigurator />;
    case FileConfigurator.Id:
      return <FileConfigurator />;
    default:
      return <Loader2 className="size-4 animate-spin" />;
  }
}
