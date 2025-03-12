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

interface ResponsiveDialogProps extends React.PropsWithChildren {
  className?: string;
  dialogClassName?: string;
  drawerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  cancelTrigger?: React.ReactNode;
  minWidth?: string;
  render?: (props: {
    isDesktop: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => React.ReactNode;
}

export function ResponsiveDialog({
  className,
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
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(`(min-width: ${minWidth})`);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const onOpenChange = onOpenChangeProp ?? setInternalOpen;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          className={cn(
            "sm:max-w-[425px] rounded-lg",
            className,
            dialogClassName
          )}
        >
          <ScrollArea className="max-h-[calc(100vh-10rem)]">
            <DialogHeader className="text-left">
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
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={cn(className, drawerClassName)}>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
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
