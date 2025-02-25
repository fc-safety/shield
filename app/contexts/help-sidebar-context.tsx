import { CircleHelp } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { useSidebar } from "~/components/ui/sidebar";

const HelpSidebarContext = createContext<{
  name: "help";
  open: boolean;
  setOpen: (open: boolean) => void;
  title: React.ReactNode;
  setTitle: (title: React.ReactNode) => void;
  content: React.ReactNode;
  setContent: (content: React.ReactNode) => void;
  contentId: string | null;
  setContentId: React.Dispatch<React.SetStateAction<string | null>>;
}>({
  name: "help",
  open: false,
  setOpen: () => {},
  title: null,
  setTitle: () => {},
  content: null,
  setContent: () => {},
  contentId: null,
  setContentId: () => {},
});

export function HelpSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isMobile,
    openMobile,
    setOpenMobile,
    open: openState,
    setOpen: setOpenState,
  } = useSidebar();
  const [title, setTitle] = useState<React.ReactNode>(
    <div className="flex items-center gap-2">
      <CircleHelp className="size-4" />
      Help
    </div>
  );
  const [content, setContent] = useState<React.ReactNode>(null);
  const [contentId, setContentId] = useState<string | null>(null);

  const open = isMobile ? openState.help : openMobile === "help";
  const setOpen = (open: boolean) => {
    if (!open) {
      setContentId(null);
    }
    if (isMobile) {
      setOpenMobile(open ? "help" : undefined);
    } else {
      setOpenState((openState) => ({ ...openState, help: open }));
    }
  };

  return (
    <HelpSidebarContext.Provider
      value={{
        name: "help",
        open,
        setOpen,
        title,
        setTitle,
        content,
        setContent,
        contentId,
        setContentId,
      }}
    >
      {children}
    </HelpSidebarContext.Provider>
  );
}

export function useHelpSidebar() {
  return useContext(HelpSidebarContext);
}
