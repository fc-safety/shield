import { AppSidebar, type SidebarGroup } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  BookOpenText,
  Building2,
  Factory,
  FileSpreadsheet,
  FireExtinguisher,
  LayoutDashboard,
  MessageCircleQuestion,
  Nfc,
  Package,
  Route as RouteIcon,
  Settings,
  Shapes,
  Shield,
  Users,
} from "lucide-react";
import { data, Outlet } from "react-router";
import { API_BASE_URL, APP_HOST } from "~/.server/config";
import { requireUserSession } from "~/.server/sessions";
import Footer from "~/components/footer";
import Header from "~/components/header";
import HelpSidebar from "~/components/help-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AuthProvider } from "~/contexts/auth-context";
import { HelpSidebarProvider } from "~/contexts/help-sidebar-context";
import { can, isGlobalAdmin } from "~/lib/users";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, session, getSessionToken } = await requireUserSession(request);

  return data(
    {
      user,
      apiUrl: API_BASE_URL,
      appHost: APP_HOST,
    },
    {
      headers: {
        "Set-Cookie": await getSessionToken(session),
      },
    }
  );
}

export default function Layout({
  loaderData: { user, apiUrl, appHost },
}: Route.ComponentProps) {
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
          hide: !can(user, "read", "assets"),
        },
        {
          title: "Inspection Routes",
          url: "inspection-routes",
          icon: RouteIcon,
          hide: !can(user, "read", "inspection-routes"),
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
      hide: !can(user, "read", "products"),
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
          hide: !can(user, "read", "product-categories"),
        },
        {
          title: "Manufacturers",
          url: "products/manufacturers",
          icon: Factory,
          hide: !can(user, "read", "manufacturers"),
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
          hide: !can(user, "read", "clients"),
        },
        {
          title: "Product Requests",
          url: "admin/product-requests",
          icon: Package,
          hide: !can(user, "read", "product-requests"),
        },
        {
          title: "Tags",
          url: "admin/tags",
          icon: Nfc,
          hide: !can(user, "read", "tags"),
        },
        {
          title: "Roles",
          url: "admin/roles",
          icon: Users,
        },
        {
          title: "Settings",
          url: "admin/settings",
          icon: Settings,
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

  return (
    <AuthProvider user={user} apiUrl={apiUrl} appHost={appHost}>
      <SidebarProvider defaultOpenState={{ help: false }}>
        <HelpSidebarProvider>
          <AppSidebar groups={groups} />
          <SidebarInset>
            <Header
              leftSlot={
                <>
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                </>
              }
            />
            <main className="flex flex-col p-2 sm:p-4 pt-0 pb-6 sm:pb-12 grow">
              <Outlet />
            </main>
            <Footer />
          </SidebarInset>
          <HelpSidebar />
        </HelpSidebarProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
