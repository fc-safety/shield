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
  DrawerNested,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useCallback, useMemo, useRef, useState, type ComponentProps } from "react";
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
    drawerContentHeight?: number;
  }) => React.ReactNode;
  // scroll area props
  disableDisplayTable?: boolean;
  // end scroll area props
  isNestedDrawer?: boolean;
  disableScrollArea?: boolean;
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
  isNestedDrawer = false,
  disableScrollArea = false,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(`(min-width: ${minWidth})`);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const onOpenChange = onOpenChangeProp ?? setInternalOpen;

  const drawerContentRef = useRef<HTMLDivElement>(null);
  const [drawerContentHeight, setDrawerContentHeight] = useState(
    drawerContentRef.current?.clientHeight ?? 400
  );

  const renderedChildren = useMemo(() => {
    return render
      ? render({
          isDesktop,
          open,
          onOpenChange,
          drawerContentHeight: !isDesktop ? drawerContentHeight : undefined,
        })
      : null;
  }, [render, isDesktop, open, onOpenChange, drawerContentHeight]);

  const ScrollAreaComponent = useCallback(
    ({ children, className }: Pick<ComponentProps<"div">, "children" | "className">) =>
      disableScrollArea ? (
        <div className={className}>{children}</div>
      ) : (
        <ScrollArea classNames={{ root: className }} disableDisplayTable={disableDisplayTable}>
          {children}
        </ScrollArea>
      ),
    []
  );

  const DrawerComponent = useMemo(() => {
    return isNestedDrawer ? DrawerNested : Drawer;
  }, [isNestedDrawer]);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild={!!trigger} className={classNames?.trigger}>
          {trigger}
        </DialogTrigger>
        <DialogContent className={cn("rounded-lg sm:max-w-[425px]", className, dialogClassName)}>
          <ScrollAreaComponent className="max-h-[calc(100dvh-10rem)]">
            <DialogHeader className={cn("text-left", classNames?.header)}>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {renderedChildren ?? children}
          </ScrollAreaComponent>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DrawerComponent open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild={!!trigger}>{trigger}</DrawerTrigger>
      <DrawerContent className={cn("max-w-[100vw]", className, drawerClassName)}>
        <ScrollAreaComponent className="h-[calc(100dvh-5rem)]">
          <div className="flex h-full flex-col">
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div
              className="w-full flex-1 px-4"
              ref={(el) => {
                drawerContentRef.current = el;
                if (el) {
                  setDrawerContentHeight(el.clientHeight);
                }
              }}
            >
              {renderedChildren ?? children}
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>{cancelTrigger}</DrawerClose>
            </DrawerFooter>
          </div>
        </ScrollAreaComponent>
      </DrawerContent>
    </DrawerComponent>
  );
}
