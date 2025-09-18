import { AnimatePresence, motion } from "framer-motion";
import { Loader2, PanelRightClose } from "lucide-react";
import { useMemo } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent } from "~/components/ui/drawer";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useAssetQuestionDetailFormContext } from "../asset-question-detail-form.context";
import { AlertTriggerConfigurator } from "./sidepanel-inserts/alert-trigger-configurator";
import { AutoSetupSupplyConfigurator } from "./sidepanel-inserts/auto-setup-supply-configurator";
import { ConditionConfigurator } from "./sidepanel-inserts/condition-configurator";
import FileConfigurator from "./sidepanel-inserts/file-configurator";
import RegulatoryCodeConfigurator from "./sidepanel-inserts/regulatory-code-configurator";

export default function FormSidepanel({ minWidth = "768px" }: { minWidth?: string }) {
  const isDesktop = useMediaQuery(`(min-width: ${minWidth})`);

  const { sidepanelId, closeSidepanel } = useAssetQuestionDetailFormContext();

  const sidePanel = useMemo(() => {
    return <FormSidepanelContent sidepanelId={sidepanelId} />;
  }, [sidepanelId]);

  if (isDesktop) {
    return (
      <AnimatePresence>
        {sidepanelId && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
              type: "tween",
            }}
            className="border-border relative shrink-0 border-l"
          >
            <Button
              variant="ghost"
              size="iconSm"
              type="button"
              className="absolute top-0 -left-10"
              onClick={closeSidepanel}
            >
              <PanelRightClose />
            </Button>
            <div className="h-full w-[22rem] px-4 pb-4">{sidePanel}</div>
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
            viewport: "flex flex-col",
          }}
        >
          <div className="w-full flex-1 px-4">{sidePanel}</div>
          <Button
            onClick={() => closeSidepanel()}
            variant="secondary"
            className="mx-4 mt-8 w-[calc(100%-2rem)]"
          >
            Done
          </Button>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

function FormSidepanelContent({ sidepanelId }: { sidepanelId: string | null }) {
  switch (sidepanelId) {
    case AutoSetupSupplyConfigurator.Id:
      return <AutoSetupSupplyConfigurator />;
    case AlertTriggerConfigurator.Id:
      return <AlertTriggerConfigurator />;
    case ConditionConfigurator.Id:
      return <ConditionConfigurator />;
    case FileConfigurator.Id:
      return <FileConfigurator />;
    case RegulatoryCodeConfigurator.Id:
      return <RegulatoryCodeConfigurator />;
    default:
      return <Loader2 className="size-4 animate-spin" />;
  }
}
