import { useMemo } from "react";
import { NavLink, Outlet } from "react-router";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import { useAuth } from "~/contexts/auth-context";
import { useViewContext } from "~/contexts/view-context";
import type { Client } from "~/lib/models";
import { can } from "~/lib/users";
import { cn } from "~/lib/utils";
import ClientDetailsCard from "../client-details-card";
import ClientDetailsHeader from "../client-details-header";

export const TABS = ["sites", "users", "invitations", "assets", "products-questions"] as const;
export type Tab = (typeof TABS)[number];

export default function ClientDetailsLayout({
  client,
  currentTab,
}: {
  client: Client;
  currentTab: Tab;
}) {
  const { user } = useAuth();
  const viewContext = useViewContext();

  const tabs = useMemo(
    (): { label: string; value: string; disabled?: boolean; hide?: boolean }[] => [
      {
        label: "Sites",
        value: "sites",
        disabled: !can(user, "read", "sites"),
      },
      {
        label: "Users",
        value: "users",
        disabled: !can(user, "read", "users"),
      },
      {
        label: "Invitations",
        value: "invitations",
        disabled: !can(user, "create", "invitations"),
        hide: viewContext !== "user", // Only show in my-organization, not admin client details
      },
      {
        label: "Assets",
        value: "assets",
        disabled: !can(user, "read", "assets"),
      },
      {
        label: "Products & Questions",
        value: "products-questions",
        disabled: !can(user, "read", "products") || !can(user, "read", "asset-questions"),
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
              {viewContext === "admin" ? "This client" : "Your organization"} has certain features
              enabled and others disabled to facilitate product demonstrations.
            </div>
          )}
          <ClientDetailsHeader client={client} />
          <NavigationMenu className="flex-none">
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
          </NavigationMenu>
          <Outlet />
        </div>
        <ClientDetailsCard client={client} />
      </div>
    </div>
  );
}
