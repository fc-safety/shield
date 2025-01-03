import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clipboard } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import { toast } from "sonner";

export const CopyableInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>((props, ref) => {
  const handleCopy = () => {
    /* eslint-disable react/prop-types */
    navigator.clipboard.writeText(props.value as string).then(() => {
      toast.success("Copied to clipboard!");
    });
  };

  return (
    <div className="relative">
      <Input {...props} ref={ref} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="absolute right-0 top-0 h-full"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
            >
              <Clipboard />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});
CopyableInput.displayName = "CopyableInput";
