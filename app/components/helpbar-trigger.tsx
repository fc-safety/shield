import { CircleHelp } from "lucide-react";
import { useId } from "react";
import { useHelpSidebar } from "~/contexts/help-sidebar-context";
import { cn } from "~/lib/utils";

export default function HelpbarTrigger({
  className,
  title,
  content,
}: {
  className?: string;
  title?: React.ReactNode;
  content: React.ReactNode;
}) {
  const { setTitle, setContent, contentId, setContentId, setOpen } =
    useHelpSidebar();
  const id = useId();

  return (
    <CircleHelp
      className={cn(
        "cursor-pointer text-muted-foreground hover:text-foreground transition-colors size-4",
        className
      )}
      onClick={() => {
        if (contentId === id) {
          setOpen(false);
          setContentId(null);
        } else {
          if (title) {
            setTitle(title);
          }
          setContent(content);
          setContentId(id);
          setOpen(true);
        }
      }}
    />
  );
}
