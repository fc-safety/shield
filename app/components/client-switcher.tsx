import { ArrowLeftRight, Building2, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useActiveAccessGrant } from "~/contexts/active-access-grant-context";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
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
  const {
    accessibleClients,
    activeClient,
    activeAccessGrant,
    setActiveAccessGrant,
    hasMultipleAccessGrants,
  } = useActiveAccessGrant();
  const [open, setOpen] = useState(false);

  // If user only has one client, just show the label (no dropdown)
  if (!hasMultipleAccessGrants) {
    return (
      <div
        className={cn(
          "min-w-0 truncate text-center text-xs font-extralight @2xl:text-sm @4xl:text-base @6xl:text-lg",
          className
        )}
      >
        {activeClient?.clientName}
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Building2 />
          <span className="truncate">{activeClient?.clientName}</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        <DropdownMenuItem disabled asChild>
          <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
            <ArrowLeftRight />
            Switch Organization
          </DropdownMenuLabel>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {accessibleClients.map((access) => {
          const isActive =
            activeAccessGrant?.clientId === access.clientId &&
            activeAccessGrant?.siteId === access.siteId &&
            activeAccessGrant?.roleId === access.roleId;
          return (
            <DropdownMenuItem
              key={`${access.clientId}-${access.siteId}-${access.roleId}`}
              onSelect={() => {
                if (!isActive) {
                  setActiveAccessGrant({
                    clientId: access.clientId,
                    siteId: access.siteId,
                    roleId: access.roleId,
                  });
                }
                setOpen(false);
              }}
              className="flex cursor-pointer items-center justify-between gap-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">{access.clientName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {access.siteName} &middot; {access.roleName}
                </span>
              </div>
              {isActive && <Check className="text-primary h-4 w-4 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
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
        "min-w-0 truncate text-center text-xs font-extralight @2xl:text-sm @4xl:text-base @6xl:text-lg",
        className
      )}
    />
  );
}
