import { CircleHelp } from "lucide-react";
import type { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

interface Props extends PropsWithChildren {
  classNames?: {
    trigger?: string;
    content?: string;
  };
}

export default function HelpPopover({ children, classNames }: Props) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <CircleHelp className={cn("size-3.5", classNames?.trigger)} />
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(
          "w-72 rounded-lg p-4 bg-background text-foreground",
          "border border-border shadow-md",
          "text-xs whitespace-normal text-start",
          classNames?.content
        )}
      >
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}
