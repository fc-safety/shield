import { Building2, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useClientAccess } from "~/contexts/client-access-context";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ClientSwitcherProps {
  className?: string;
}

export function ClientSwitcher({ className }: ClientSwitcherProps) {
  const { accessibleClients, activeClient, activeClientId, setActiveClient, hasMultipleClients } =
    useClientAccess();
  const [open, setOpen] = useState(false);

  // If user only has one client, just show the label (no dropdown)
  if (!hasMultipleClients) {
    return (
      <div
        className={cn(
          "min-w-0 flex-1 truncate text-center text-xs font-extralight @2xl:text-sm @4xl:text-base @6xl:text-lg",
          className
        )}
      >
        {activeClient?.client.name}
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md px-2 py-1 text-center transition-colors hover:bg-accent/50",
            className
          )}
        >
          <span className="truncate text-xs font-extralight @2xl:text-sm @4xl:text-base @6xl:text-lg">
            {activeClient?.client.name}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accessibleClients.map((access) => (
          <DropdownMenuItem
            key={access.id}
            onSelect={() => {
              if (access.client.externalId !== activeClientId) {
                setActiveClient(access.client.externalId);
              }
              setOpen(false);
            }}
            className="flex cursor-pointer items-center justify-between gap-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium">{access.client.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {access.role.name}
                {access.site && ` - ${access.site.name}`}
              </span>
            </div>
            {access.client.externalId === activeClientId && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Fallback component to show while client access is loading or if context is not available.
 */
export function ClientSwitcherFallback({ className }: ClientSwitcherProps) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 truncate text-center text-xs font-extralight @2xl:text-sm @4xl:text-base @6xl:text-lg",
        className
      )}
    />
  );
}
