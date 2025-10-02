import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ExternalLink } from "lucide-react";
import { NavLink, useMatches } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";

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
  external?: boolean;
}

export interface SidebarMenuSubItem {
  title: string;
  url: string;
  hide?: boolean;
  exact?: boolean;
}

export function AppSidebar({ groups }: { groups: SidebarGroup[] }) {
  const { setOpenMobile } = useSidebar();

  const matches = useMatches();

  return (
    <Sidebar collapsible="icon" className="z-20">
      {/* <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="gap-1.5">
              <Link to="/">
                <img
                  src={
                    "https://content.fc-safety.com/fc_shield_logo_small_light.png"
                  }
                  alt=""
                  className="h-4 w-auto object-contain dark:hidden"
                />
                <img
                  src={
                    "https://content.fc-safety.com/fc_shield_logo_small_dark.png"
                  }
                  alt=""
                  className="h-4 w-auto object-contain hidden dark:block"
                />
                <div>
                  <img
                    src={
                      "https://content.fc-safety.com/fc_shield_logo_text_light.png"
                    }
                    alt=""
                    className="h-4 dark:hidden"
                  />
                  <img
                    src={
                      "https://content.fc-safety.com/fc_shield_logo_text_dark.png"
                    }
                    alt=""
                    className="h-4 hidden dark:block"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader> */}
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
                                (r) => m.pathname === r.url || m.pathname === `/${r.url}`
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
                                                    m.pathname === subItem.url ||
                                                    m.pathname === `/${subItem.url}`
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
                            target={item.external ? "_blank" : undefined}
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
                                        m.pathname === item.url || m.pathname === `/${item.url}`
                                    ))
                                }
                              >
                                <span>
                                  {item.icon && <item.icon />}
                                  <span>{item.title}</span>
                                  {item.external && <ExternalLink />}
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
          {/* <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.name ?? user?.email ?? "My Account"}
                  <ChevronUp className="ml-auto" />
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
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
