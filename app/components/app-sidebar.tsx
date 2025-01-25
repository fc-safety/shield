import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BookOpenText,
  Building2,
  ChevronRight,
  ChevronUp,
  Factory,
  FileSpreadsheet,
  FireExtinguisher,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
  Nfc,
  Package,
  Shapes,
  Shield,
  User2,
  UserCog,
  Users,
} from "lucide-react";
import { Link, NavLink, useMatches } from "react-router";
import type { User } from "~/.server/authenticator";
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
} from "~/components/ui/sidebar";
import { isGlobalAdmin } from "~/lib/users";

interface AppSidebarProps {
  user?: User;
}

interface SidebarGroup {
  groupTitle: string;
  items: SidebarMenuItem[];
  hide?: boolean;
}

interface SidebarMenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType;
  children?: SidebarMenuSubItem[];
  defaultOpen?: boolean;
  hide?: boolean;
}

interface SidebarMenuSubItem {
  title: string;
  url: string;
  hide?: boolean;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const groups: SidebarGroup[] = [
    {
      groupTitle: "Application",
      items: [
        {
          title: "Dashboard",
          url: "dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Assets",
          url: "assets",
          icon: Shield,
        },
        {
          title: "Reports",
          url: "reports",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      groupTitle: "Products",
      items: [
        {
          title: "All Products",
          url: "products/all",
          icon: FireExtinguisher,
        },
        {
          title: "Categories",
          url: "products/categories",
          icon: Shapes,
        },
        {
          title: "Manufacturers",
          url: "products/manufacturers",
          icon: Factory,
        },
      ],
    },
    {
      groupTitle: "Admin",
      items: [
        {
          title: "Clients",
          url: "admin/clients",
          icon: Building2,
        },
        {
          title: "Order Reqeusts",
          url: "admin/order-requests",
          icon: Package,
        },
        {
          title: "Tags",
          url: "admin/tags",
          icon: Nfc,
        },
        {
          title: "Roles",
          url: "admin/roles",
          icon: Users,
          hide: !user || !isGlobalAdmin(user),
        },
      ],
      hide: !user || !isGlobalAdmin(user),
    },
    {
      groupTitle: "Support",
      items: [
        {
          title: "FAQs",
          url: "faqs",
          icon: BookOpenText,
        },
        {
          title: "Contact",
          url: "contact",
          icon: MessageCircleQuestion,
        },
      ],
    },
  ];

  const matches = useMatches();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <img
                  src="https://fc-safety.com/wp-content/uploads/2017/08/favicon.png"
                  alt=""
                  className="w-10 -translate-y-[0.15rem]"
                />
                <span>Shield</span>
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
                                      <NavLink to={subItem.url}>
                                        {({ isActive }) => (
                                          <SidebarMenuSubButton
                                            asChild
                                            isActive={
                                              isActive ||
                                              matches.some(
                                                (m) =>
                                                  m.pathname === subItem.url ||
                                                  m.pathname ===
                                                    `/${subItem.url}`
                                              )
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
                          <NavLink to={item.url}>
                            {({ isActive }) => (
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  isActive ||
                                  matches.some(
                                    (m) =>
                                      m.pathname === item.url ||
                                      m.pathname === `/${item.url}`
                                  )
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
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <UserCog /> Account
                  </Link>
                </DropdownMenuItem>
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
