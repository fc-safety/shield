import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { ScrollArea } from "./ui/scroll-area";

interface ResponsiveDialogProps
  extends React.PropsWithChildren,
    Pick<React.ComponentPropsWithoutRef<typeof ScrollArea>, "disableDisplayTable"> {
  className?: string;
  classNames?: {
    trigger?: string;
    header?: string;
  };
  dialogClassName?: string;
  drawerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: string;
  cancelTrigger?: React.ReactNode;
  minWidth?: string;
  render?: (props: {
    isDesktop: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => React.ReactNode;
  // scroll area props
  disableDisplayTable?: boolean;
  // end scroll area props
}

export function ResponsiveDialog({
  className,
  classNames,
  dialogClassName,
  drawerClassName,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  trigger,
  cancelTrigger,
  title,
  description,
  children,
  minWidth = "768px",
  render,
  disableDisplayTable,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(`(min-width: ${minWidth})`);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const onOpenChange = onOpenChangeProp ?? setInternalOpen;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild={!!trigger} className={classNames?.trigger}>
          {trigger}
        </DialogTrigger>
        <DialogContent className={cn("rounded-lg sm:max-w-[425px]", className, dialogClassName)}>
          <ScrollArea
            classNames={{
              root: "max-h-[calc(100dvh-10rem)]",
            }}
            disableDisplayTable={disableDisplayTable}
          >
            <DialogHeader className={cn("text-left", classNames?.header)}>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {render ? render({ isDesktop, open, onOpenChange }) : children}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild={!!trigger}>{trigger}</DrawerTrigger>
      <DrawerContent className={cn("max-w-[100vw]", className, drawerClassName)}>
        <ScrollArea
          classNames={{
            root: "h-[calc(100vh-5rem)]",
          }}
          disableDisplayTable={disableDisplayTable}
        >
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="w-full px-4">
            {render ? render({ isDesktop, open, onOpenChange }) : children}
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>{cancelTrigger}</DrawerClose>
          </DrawerFooter>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
