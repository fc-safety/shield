import { Link, NavLink } from "react-router";
import {
  BookOpenText,
  Boxes,
  Building2,
  ChevronUp,
  FileSpreadsheet,
  FireExtinguisher,
  LayoutDashboard,
  MessageCircleQuestion,
  Nfc,
  Settings,
  Shield,
  User2,
} from "lucide-react";
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
  SidebarRail,
} from "~/components/ui/sidebar";

export function AppSidebar() {
  const items = [
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
        {
          title: "Settings",
          url: "settings",
          icon: Settings,
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
          title: "Categories",
          url: "admin/categories",
          icon: Boxes,
        },
        {
          title: "Products",
          url: "admin/products",
          icon: FireExtinguisher,
        },
        {
          title: "Tags",
          url: "admin/tags",
          icon: Nfc,
        },
      ],
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
        {items.map(({ groupTitle, items }) => (
          <SidebarGroup key={groupTitle}>
            <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink to={item.url}>
                      {({ isActive }) => (
                        <SidebarMenuButton asChild isActive={isActive}>
                          <span>
                            <item.icon />
                            <span>{item.title}</span>
                          </span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
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
                  <User2 /> john.doe@example.com
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
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
