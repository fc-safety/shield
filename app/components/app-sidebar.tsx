import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, ChevronUp, LogOut, User2, UserCog } from "lucide-react";
import { Link, NavLink, useMatches } from "react-router";
import { useTheme } from "remix-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";
import { useAuth } from "~/contexts/auth-context";

export interface SidebarGroup {
  groupTitle: string;
  items: SidebarMenuItem[];
  hide?: boolean;
}

export interface SidebarMenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType;
  children?: SidebarMenuSubItem[];
  defaultOpen?: boolean;
  hide?: boolean;
  exact?: boolean;
}

export interface SidebarMenuSubItem {
  title: string;
  url: string;
  hide?: boolean;
  exact?: boolean;
}

export const DEFAULT_USER_ROUTES = [
  {
    title: "Account",
    url: "/account",
    icon: UserCog,
  },
];

export function AppSidebar({
  groups,
  userRoutes = DEFAULT_USER_ROUTES,
}: {
  groups: SidebarGroup[];
  userRoutes?: (Omit<SidebarMenuItem, "children" | "url"> & { url: string })[];
}) {
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();

  const [theme] = useTheme();

  const matches = useMatches();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="gap-1.5">
              <Link to="/">
                <img
                  src={
                    theme === "dark"
                      ? "https://content.fc-safety.com/fc_shield_logo_small_dark.png"
                      : "https://content.fc-safety.com/fc_shield_logo_small_light.png"
                  }
                  alt=""
                  className="w-8"
                />
                <span className="text-2xl uppercase font-light">Shield</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups
          .filter((g) => !g.hide)
          .map(({ groupTitle, items }) => (
            <SidebarGroup key={groupTitle}>
              <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items
                    .filter((i) => !i.hide)
                    .map((item) =>
                      item.children?.length ? (
                        <Collapsible
                          key={item.title}
                          asChild
                          defaultOpen={
                            item.defaultOpen ||
                            matches.some((m) =>
                              item.children?.some(
                                (r) =>
                                  m.pathname === r.url ||
                                  m.pathname === `/${r.url}`
                              )
                            )
                          }
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.children
                                  .filter((c) => !c.hide)
                                  .map((subItem) => (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <NavLink
                                        to={subItem.url}
                                        end={subItem.exact}
                                        onClick={() => setOpenMobile(undefined)}
                                      >
                                        {({ isActive }) => (
                                          <SidebarMenuSubButton
                                            asChild
                                            isActive={
                                              isActive ||
                                              (!subItem.exact &&
                                                matches.some(
                                                  (m) =>
                                                    m.pathname ===
                                                      subItem.url ||
                                                    m.pathname ===
                                                      `/${subItem.url}`
                                                ))
                                            }
                                          >
                                            <span>{subItem.title}</span>
                                          </SidebarMenuSubButton>
                                        )}
                                      </NavLink>
                                    </SidebarMenuSubItem>
                                  ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      ) : item.url ? (
                        <SidebarMenuItem key={item.title}>
                          <NavLink
                            to={item.url}
                            end={item.exact}
                            onClick={() => setOpenMobile(undefined)}
                          >
                            {({ isActive }) => (
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  isActive ||
                                  (!item.exact &&
                                    matches.some(
                                      (m) =>
                                        m.pathname === item.url ||
                                        m.pathname === `/${item.url}`
                                    ))
                                }
                              >
                                <span>
                                  {item.icon && <item.icon />}
                                  <span>{item.title}</span>
                                </span>
                              </SidebarMenuButton>
                            )}
                          </NavLink>
                        </SidebarMenuItem>
                      ) : (
                        <></>
                      )
                    )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.name ?? user?.email ?? "My Account"}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                {userRoutes.map((route) => (
                  <DropdownMenuItem asChild key={route.title}>
                    <Link to={route.url}>
                      <route.icon /> {route.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link to="/logout">
                    <LogOut />
                    <span>Sign out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
