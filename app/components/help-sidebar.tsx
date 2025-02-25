import { X } from "lucide-react";
import { type PropsWithChildren } from "react";
import { useHelpSidebar } from "~/contexts/help-sidebar-context";
import { Button } from "./ui/button";
import { Sidebar, SidebarContent, SidebarHeader } from "./ui/sidebar";

export default function HelpSidebar() {
  const { title, content, setOpen } = useHelpSidebar();

  return (
    <Sidebar collapsible="offcanvas" name="help" side="right">
      <SidebarHeader className="p-2 sm:p-4">
        <h2 className="text-lg font-bold flex items-center justify-between">
          <div>{title}</div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </h2>
      </SidebarHeader>
      <SidebarContent className="p-2 sm:p-4 pt-0 sm:pt-0 text-sm">
        {content}
      </SidebarContent>
    </Sidebar>
  );
}

export function HelpSidebarContent({ children }: PropsWithChildren) {
  return <div className="grid gap-4">{children}</div>;
}

export function HelpSidebarSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="grid gap-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{content}</p>
    </div>
  );
}
