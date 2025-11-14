import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

export const CopyableText = ({
  text,
  hoverOnly = false,
  compact = false,
  className,
}: {
  text: string;
  hoverOnly?: boolean;
  compact?: boolean;
  className?: string;
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    });
  };

  return (
    <div className={cn("group flex items-center gap-2", className)}>
      {text && !compact && (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{text}</span>
      )}
      {text && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {compact ? (
                <Button onClick={handleCopy} type="button" variant="outline" className={"h-7"}>
                  {text}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="iconSm"
                  className={cn(
                    "text-muted-foreground h-7 w-7",
                    hoverOnly && "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={handleCopy}
                  type="button"
                >
                  <Clipboard />
                </Button>
              )}
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
