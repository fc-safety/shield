import { ChevronDown, LogOut, UserCog, UserRound } from "lucide-react";
import { Link } from "react-router";
import type { User } from "~/.server/authenticator";
import type { SidebarMenuItem } from "./app-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenuButton } from "./ui/sidebar";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton>
          <div className="bg-primary/20 border-primary text-primary flex size-5 shrink-0 items-end justify-center overflow-hidden rounded-full border">
            <UserRound className="size-4" />
          </div>
          <div className="hidden sm:block">{user?.name ?? user?.email ?? "My Account"}</div>
          <ChevronDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
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
