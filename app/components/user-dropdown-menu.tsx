import { ChevronDown, LogOut, UserCog, UserRound } from "lucide-react";
import { Link } from "react-router";
import type { User } from "~/.server/authenticator";
import useMyOrganization from "~/hooks/use-my-organization";
import type { GetMyOrganizationResult } from "~/lib/services/clients.service";
import type { SidebarMenuItem } from "./app-sidebar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const DEFAULT_USER_ROUTES = [
  {
    title: "Account",
    url: "/account",
    icon: UserCog,
  },
];

export function UserDropdownMenu({
  user,
  userRoutes = DEFAULT_USER_ROUTES,
  logoutReturnTo,
}: {
  user: User;
  userRoutes?: (Omit<SidebarMenuItem, "children" | "url"> & { url: string })[];
  logoutReturnTo?: string;
}) {
  const accountLabel = user?.name ?? user?.email ?? "My Account";
  let client: GetMyOrganizationResult["client"] | undefined;
  try {
    ({ client } = useMyOrganization());
  } catch (e) {}

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" type="button">
          <div className="bg-primary/20 border-primary text-primary flex size-5 shrink-0 items-end justify-center overflow-hidden rounded-full border">
            <UserRound className="size-4" />
          </div>
          <div className="hidden sm:block">{accountLabel}</div>
          <ChevronDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
        <DropdownMenuLabel>
          <div className="block w-max max-w-50 truncate sm:hidden">{accountLabel}</div>
          <div className="hidden w-max max-w-50 truncate sm:block">My Organization</div>
          <div className="text-xs font-normal">{client?.name}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userRoutes.map((route) => (
          <DropdownMenuItem asChild key={route.title}>
            <Link to={route.url}>
              <route.icon /> {route.title}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link to={`/logout${logoutReturnTo ? `?returnTo=${logoutReturnTo}` : ""}`}>
            <LogOut />
            <span>Sign out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
