import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

export const CopyableText = ({
  text,
  hoverOnly = false,
}: {
  text: string;
  hoverOnly?: boolean;
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    });
  };

  return (
    <div className="flex items-center gap-2 group">
      {text}
      {text && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 text-muted-foreground",
                  hoverOnly && "opacity-0 group-hover:opacity-100"
                )}
                onClick={handleCopy}
                type="button"
              >
                <Clipboard />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
