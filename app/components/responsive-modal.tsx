import * as React from "react";
import { createContext, useContext } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import useIsMobile from "~/hooks/use-is-mobile";
import { ScrollArea } from "./ui/scroll-area";

// --- Context ---

interface ResponsiveModalContextValue {
  isMobile: boolean;
}

const ResponsiveModalContext = createContext<ResponsiveModalContextValue | null>(null);

function useResponsiveModal() {
  const ctx = useContext(ResponsiveModalContext);
  return ctx ?? { isMobile: false };
}

// --- Root ---

interface ResponsiveModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isNested?: boolean;
}

function ResponsiveModal({ children, open, onOpenChange, isNested = false }: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  const Root = isMobile ? (isNested ? DrawerNested : Drawer) : Dialog;

  return (
    <ResponsiveModalContext.Provider value={{ isMobile }}>
      <Root open={open} onOpenChange={onOpenChange}>
        {children}
      </Root>
    </ResponsiveModalContext.Provider>
  );
}

// --- Trigger ---

function ResponsiveModalTrigger({
  children,
  asChild = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTrigger>) {
  const { isMobile } = useResponsiveModal();
  const Comp = isMobile ? DrawerTrigger : DialogTrigger;
  return (
    <Comp asChild={asChild} {...props}>
      {children}
    </Comp>
  );
}

// --- Content ---

interface ResponsiveModalContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogContent>, "className"> {
  className?: string;
  classNames?: { dialog?: string; drawer?: string };
}

function ResponsiveModalContent({
  children,
  className,
  classNames,
  ...props
}: ResponsiveModalContentProps) {
  const { isMobile } = useResponsiveModal();

  if (!isMobile) {
    return (
      <DialogContent
        className={cn("flex flex-col rounded-lg sm:max-w-[425px]", className, classNames?.dialog)}
        {...props}
      >
        <div className="flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden">{children}</div>
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={cn("max-w-[100vw]", className, classNames?.drawer)} {...props}>
      <div className="flex h-[calc(100dvh-5rem)] flex-col">{children}</div>
    </DrawerContent>
  );
}

// --- Header ---

function ResponsiveModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = useResponsiveModal();
  const Comp = isMobile ? DrawerHeader : DialogHeader;
  return <Comp className={cn("shrink-0 text-left", className)} {...props} />;
}

// --- Title ---

function ResponsiveModalTitle({ ...props }: React.ComponentPropsWithoutRef<typeof DialogTitle>) {
  const { isMobile } = useResponsiveModal();
  const Comp = isMobile ? DrawerTitle : DialogTitle;
  return <Comp {...props} />;
}

// --- Description ---

function ResponsiveModalDescription({
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogDescription>) {
  const { isMobile } = useResponsiveModal();
  const Comp = isMobile ? DrawerDescription : DialogDescription;
  return <Comp {...props} />;
}

// --- Body ---

interface ResponsiveModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  disableScrollArea?: boolean;
}

function ResponsiveModalBody({
  className,
  disableScrollArea = false,
  children,
  ...props
}: ResponsiveModalBodyProps) {
  const { isMobile } = useResponsiveModal();
  const content = (
    <div className={cn(isMobile && "px-4", className)} {...props}>
      {children}
    </div>
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {disableScrollArea ? (
        content
      ) : (
        <ScrollArea classNames={{ root: "min-h-0 flex-1", viewport: "p-1" }}>
          {content}
        </ScrollArea>
      )}
    </div>
  );
}

// --- Footer ---

function ResponsiveModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = useResponsiveModal();
  const Comp = isMobile ? DrawerFooter : DialogFooter;
  return (
    <Comp
      className={cn("bg-background shrink-0 border-t p-4", isMobile && "pt-2", className)}
      {...props}
    />
  );
}

// --- Close ---

function ResponsiveModalClose({ ...props }: React.ComponentPropsWithoutRef<typeof DialogClose>) {
  const { isMobile } = useResponsiveModal();
  const Comp = isMobile ? DrawerClose : DialogClose;
  return <Comp {...props} />;
}

export {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalClose,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
  useResponsiveModal,
};
