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
import { useMediaQuery } from "usehooks-ts";

interface ResponsiveDialogProps extends React.PropsWithChildren {
  dialogClassName?: string;
  drawerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  cancelTrigger?: React.ReactNode;
  minWidth?: string;
}

export function ResponsiveDialog({
  dialogClassName,
  drawerClassName,
  open,
  onOpenChange,
  trigger,
  cancelTrigger,
  title,
  description,
  children,
  minWidth = "768px",
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(`(min-width: ${minWidth})`);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          className={cn("sm:max-w-[425px] rounded-lg", dialogClassName)}
        >
          <DialogHeader className="text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={cn(drawerClassName)}>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{children}</div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>{cancelTrigger}</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
