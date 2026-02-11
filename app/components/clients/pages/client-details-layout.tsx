import { useMemo } from "react";
import { NavLink, Outlet } from "react-router";
import GradientScrollArea from "~/components/gradient-scroll-area";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import { ScrollBar } from "~/components/ui/scroll-area";
import { useAuth } from "~/contexts/auth-context";
import { useAccessIntent } from "~/contexts/requested-access-context";
import type { Client } from "~/lib/models";
import { CAPABILITIES } from "~/lib/permissions";
import { can, hasMultiSiteVisibility } from "~/lib/users";
import { cn } from "~/lib/utils";
import ClientDetailsCard from "../client-details-card";
import ClientDetailsHeader from "../client-details-header";

export const TABS = ["sites", "members", "assets", "products-questions"] as const;
export type Tab = (typeof TABS)[number];

export default function ClientDetailsLayout({
  client,
  currentTab,
}: {
  client: Client;
  currentTab: Tab;
}) {
  const { user } = useAuth();
  const accessIntent = useAccessIntent();

  const tabs = useMemo(
    (): { label: string; value: string; disabled?: boolean; hide?: boolean }[] => [
      {
        label: "Sites",
        value: "sites",
        disabled: !hasMultiSiteVisibility(user),
      },
      {
        label: "Members",
        value: "members",
        disabled: !can(user, CAPABILITIES.MANAGE_USERS),
      },
      {
        label: "Assets",
        value: "assets",
        disabled: !can(user, CAPABILITIES.PERFORM_INSPECTIONS),
      },
      {
        label: "Products & Questions",
        value: "products-questions",
        disabled: !can(user, CAPABILITIES.CONFIGURE_PRODUCTS),
      },
    ],
    [user]
  );

  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid w-full grid-cols-1 gap-2 @4xl:grid-cols-[1fr_325px]">
        <div className="flex min-w-0 flex-col gap-2">
          {client.demoMode && (
            <div className="bg-primary/10 border-primary/50 text-primary w-full rounded-xl border px-2 py-1 text-xs">
              <span className="font-semibold">Demo mode enabled:</span>{" "}
              {accessIntent === "system" ? "This client" : "Your organization"} has certain features
              enabled and others disabled to facilitate product demonstrations.
            </div>
          )}
          <ClientDetailsHeader client={client} />
          <NavigationMenu className="flex-none">
            <GradientScrollArea>
              <NavigationMenuList>
                {tabs
                  .filter((tab) => !tab.hide)
                  .map((tab) => (
                    <NavigationMenuItem
                      key={tab.value}
                      className={cn({
                        "cursor-not-allowed": tab.disabled,
                      })}
                      title={
                        tab.disabled ? "You do not have permission to access this tab" : undefined
                      }
                    >
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <NavLink
                          to={`./${tab.value}`}
                          data-is-active={currentTab === tab.value}
                          aria-disabled={tab.disabled}
                        >
                          {tab.label}
                        </NavLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
              </NavigationMenuList>
              <ScrollBar orientation="horizontal" />
            </GradientScrollArea>
          </NavigationMenu>
          <Outlet />
        </div>
        <ClientDetailsCard client={client} />
      </div>
    </div>
  );
}
