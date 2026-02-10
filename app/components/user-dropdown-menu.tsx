import { ChevronDown, LogOut, Moon, Sun, UserCog, UserRound } from "lucide-react";
import { Link } from "react-router";
import { Theme, useTheme } from "remix-themes";
import type { User } from "~/.server/authenticator";
import type { SidebarMenuItem } from "./app-sidebar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const DEFAULT_USER_ROUTES = [
  {
    type: "link",
    title: "Account",
    url: "/account",
    icon: UserCog,
  },
] satisfies (SidebarMenuItem & { type: "link" })[];

export function UserDropdownMenu({
  user,
  userRoutes = DEFAULT_USER_ROUTES,
  logoutReturnTo,
}: {
  user: User;
  userRoutes?: (SidebarMenuItem & { type: "link" })[];
  logoutReturnTo?: string;
}) {
  const accountLabel = user?.name ?? user?.email ?? "My Account";

  const [, setTheme] = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <div className="bg-primary/20 border-primary text-primary flex size-5 shrink-0 items-end justify-center overflow-hidden rounded-full border">
            <UserRound className="size-4" />
          </div>
          <div className="hidden sm:block">{accountLabel}</div>
          <ChevronDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
        <DropdownMenuLabel>
          <div className="block w-max max-w-50 truncate">
            {user?.name ?? user?.email ?? "My Account"}
          </div>
          {user.name && user.email && (
            <div className="truncate text-xs font-normal">{user.email}</div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userRoutes.map((route) => (
          <DropdownMenuItem asChild key={route.title}>
            <Link to={route.url}>
              <route.icon /> {route.title}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild key="theme">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme(Theme.LIGHT)}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(Theme.DARK)}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(null)}>System</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuItem>
        <DropdownMenuItem asChild key="logout">
          <Link to={`/logout${logoutReturnTo ? `?returnTo=${logoutReturnTo}` : ""}`}>
            <LogOut />
            <span>Sign out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
