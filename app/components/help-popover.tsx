import { CircleHelp } from "lucide-react";
import type { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

interface Props extends PropsWithChildren {
  classNames?: {
    trigger?: string;
    content?: string;
  };
  inline?: boolean;
}

export default function HelpPopover({ children, classNames, inline }: Props) {
  return (
    <HoverCard>
      <HoverCardTrigger className={cn(inline && "inline-block")}>
        <CircleHelp className={cn("size-3.5", classNames?.trigger)} />
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(
          "bg-background text-foreground w-72 rounded-lg p-4",
          "border-border border shadow-md",
          "text-start text-xs whitespace-normal",
          classNames?.content
        )}
      >
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}
