import { AppSidebar, type SidebarGroup } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  BookOpenText,
  Building,
  Building2,
  CircleHelp,
  Factory,
  FileSpreadsheet,
  FireExtinguisher,
  LayoutDashboard,
  MailQuestion,
  Nfc,
  Package,
  Route as RouteIcon,
  Settings,
  Shapes,
  Shield,
  Terminal,
  Users,
} from "lucide-react";
import { Outlet, useMatches } from "react-router";
import { config } from "~/.server/config";
import { requireUserSession } from "~/.server/user-sesssion";
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
  const { user } = await requireUserSession(request);

  return {
    user,
    apiUrl: config.API_BASE_URL,
    appHost: config.APP_HOST,
    googleMapsApiKey: config.GOOGLE_MAPS_API_KEY,
    authClientId: config.CLIENT_ID,
  };
}

export default function Layout({
  loaderData: { user, apiUrl, appHost, googleMapsApiKey, authClientId },
}: Route.ComponentProps) {
  const matches = useMatches();

  const groups: SidebarGroup[] = [
    {
      groupTitle: "My Shield",
      items: [
        {
          title: "Command Center",
          url: "command-center",
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
        {
          title: "My Organization",
          url: "my-organization",
          icon: Building,
          hide: !can(user, "read", "clients"),
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
          title: "Supply Requests",
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
        {
          title: "Advanced",
          url: "admin/advanced",
          icon: Terminal,
          children: [
            {
              title: "Jobs",
              url: "admin/advanced/jobs",
            },
          ],
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
          icon: CircleHelp,
        },
        {
          title: "Docs",
          url: "docs",
          icon: BookOpenText,
        },
        {
          title: "Contact",
          url: "contact",
          icon: MailQuestion,
        },
      ],
    },
  ];

  return (
    <AuthProvider
      user={user}
      apiUrl={apiUrl}
      appHost={appHost}
      googleMapsApiKey={googleMapsApiKey}
      clientId={authClientId}
    >
      <SidebarProvider defaultOpenState={{ help: false }}>
        <HelpSidebarProvider>
          <AppSidebar groups={groups} />
          <SidebarInset className="min-w-0">
            <Header
              leftSlot={
                <>
                  <SidebarTrigger className="-ml-1.5" />
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
