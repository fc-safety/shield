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
  Shapes,
  Shield,
  Users,
} from "lucide-react";
import { data, Outlet } from "react-router";
import { API_BASE_URL } from "~/.server/config";
import { requireUserSession } from "~/.server/sessions";
import Footer from "~/components/footer";
import Header from "~/components/header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AuthProvider } from "~/contexts/auth-context";
import { isGlobalAdmin } from "~/lib/users";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, session, getSessionToken } = await requireUserSession(request);

  return data(
    {
      user,
      apiUrl: API_BASE_URL,
    },
    {
      headers: {
        "Set-Cookie": await getSessionToken(session),
      },
    }
  );
}

export default function Layout({
  loaderData: { user, apiUrl },
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
          title: "Product Requests",
          url: "admin/product-requests",
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

  return (
    <AuthProvider user={user} apiUrl={apiUrl}>
      <SidebarProvider>
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
      </SidebarProvider>
    </AuthProvider>
  );
}
