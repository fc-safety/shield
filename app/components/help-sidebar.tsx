import { X } from "lucide-react";
import { type PropsWithChildren } from "react";
import { useHelpSidebar } from "~/contexts/help-sidebar-context";
import { Button } from "./ui/button";
import { Sidebar, SidebarContent, SidebarHeader } from "./ui/sidebar";

export default function HelpSidebar() {
  const { title, content, contentId, setOpen } = useHelpSidebar();

  // if (contentId === null) {
  //   return null;
  // }

  return (
    <Sidebar
      collapsible="offcanvas"
      name="help"
      side="right"
      open={contentId === null ? false : undefined}
    >
      <SidebarHeader className="p-2 sm:p-4">
        <h2 className="flex items-center justify-between text-lg font-bold">
          <div>{title}</div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </h2>
      </SidebarHeader>
      <SidebarContent className="p-2 pt-0 text-sm sm:p-4 sm:pt-0">{content}</SidebarContent>
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
  content: string | string[];
}) {
  const contents = Array.isArray(content) ? content : [content];
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {contents.map((c, index) => (
        <p key={index} className="text-muted-foreground indent-2 text-sm">
          {c}
        </p>
      ))}
    </div>
  );
}
