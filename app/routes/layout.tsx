import { AppSidebar, type SidebarGroup } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import {
  BookOpenText,
  Building,
  Building2,
  CircleHelp,
  Factory,
  FileSpreadsheet,
  FireExtinguisher,
  LayoutDashboard,
  MessageCircleMore,
  Nfc,
  Package,
  Route as RouteIcon,
  Settings,
  Shapes,
  Shield,
  ShieldQuestion,
  Terminal,
  Users,
} from "lucide-react";
import { Outlet, useSearchParams } from "react-router";
import { getAuthenticatedFetcher } from "~/.server/api-utils";
import { config } from "~/.server/config";
import { requireUserSession } from "~/.server/user-sesssion";
import Footer from "~/components/footer";
import Header from "~/components/header";
import HelpSidebar from "~/components/help-sidebar";
import WelcomeOnboarding from "~/components/onboarding/welcome-onboarding";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { ActiveAccessGrantProvider } from "~/contexts/active-access-grant-context";
import { AuthProvider } from "~/contexts/auth-context";
import { HelpSidebarProvider } from "~/contexts/help-sidebar-context";
import { CAPABILITIES } from "~/lib/permissions";
import { getMyClientAccessQueryOptions } from "~/lib/services/client-access.service";
import { getMyOrganizationQueryOptions } from "~/lib/services/clients.service";
import { can, isGlobalAdmin, isSystemsAdmin } from "~/lib/users";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUserSession(request);

  const queryClient = new QueryClient();
  const fetcher = getAuthenticatedFetcher(request);
  const prefetchPromises = [
    queryClient.prefetchQuery(getMyOrganizationQueryOptions(fetcher)),
    queryClient.prefetchQuery(getMyClientAccessQueryOptions(fetcher)),
  ];

  await Promise.all(prefetchPromises);

  return {
    user,
    apiUrl: config.API_BASE_URL,
    appHost: config.APP_HOST,
    googleMapsApiKey: config.GOOGLE_MAPS_API_KEY,
    authClientId: config.CLIENT_ID,
    dehydratedState: dehydrate(queryClient),
  };
}

export default function Layout({
  loaderData: { user, apiUrl, appHost, googleMapsApiKey, authClientId },
}: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "true";

  const groups: SidebarGroup[] = [
    {
      groupTitle: "My Shield",
      items: [
        {
          type: "link",
          title: "Command Center",
          url: "command-center",
          icon: LayoutDashboard,
        },
        {
          type: "link",
          title: "Assets",
          url: "assets",
          icon: Shield,
          hide: !can(user, CAPABILITIES.PERFORM_INSPECTIONS),
        },
        {
          type: "link",
          title: "Inspection Routes",
          url: "inspection-routes",
          icon: RouteIcon,
          hide: !can(user, CAPABILITIES.MANAGE_ROUTES),
        },
        {
          type: "link",
          title: "Reports",
          url: "reports",
          icon: FileSpreadsheet,
        },
        {
          type: "link",
          title: "My Organization",
          url: "my-organization",
          icon: Building,
        },
      ],
      hide: !user.activeClientId,
    },
    {
      groupTitle: "Products",
      hide: !isGlobalAdmin(user) || !can(user, CAPABILITIES.CONFIGURE_PRODUCTS),
      items: [
        {
          type: "link",
          title: "All Products",
          url: "products/all",
          icon: FireExtinguisher,
        },
        {
          type: "link",
          title: "Categories",
          url: "products/categories",
          icon: Shapes,
        },
        {
          type: "link",
          title: "Manufacturers",
          url: "products/manufacturers",
          icon: Factory,
        },
        {
          type: "link",
          title: "Questions",
          url: "products/questions",
          icon: ShieldQuestion,
        },
      ],
    },
    {
      groupTitle: "Admin",
      items: [
        {
          type: "link",
          title: "Clients",
          url: "admin/clients",
          icon: Building2,
        },
        {
          type: "link",
          title: "Supply Requests",
          url: "admin/product-requests",
          icon: Package,
        },
        {
          type: "link",
          title: "Tags",
          url: "admin/tags",
          icon: Nfc,
        },
        {
          type: "group",
          title: "Users",
          icon: Users,
          children: [
            {
              title: "All Users",
              url: "admin/users",
            },
            {
              title: "Roles",
              url: "admin/roles",
            },
          ],
        },
        {
          type: "link",
          title: "Settings",
          url: "admin/settings",
          icon: Settings,
        },
        {
          type: "group",
          title: "Advanced",
          icon: Terminal,
          children: [
            {
              title: "Jobs",
              url: "admin/advanced/jobs",
            },
          ],
        },
      ],
      hide: !user || !isSystemsAdmin(user),
    },
    {
      groupTitle: "Support",
      items: [
        {
          type: "link",
          title: "Contact Us",
          url: "contact-us",
          icon: MessageCircleMore,
        },
        {
          type: "link",
          title: "FAQs",
          url: "faqs",
          icon: CircleHelp,
        },
        {
          type: "link",
          title: "Docs",
          url: "docs",
          icon: BookOpenText,
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
      <ActiveAccessGrantProvider>
        {showWelcome && <WelcomeOnboarding showWelcome={showWelcome} />}
        <SidebarProvider defaultOpenState={{ help: false }}>
          <HelpSidebarProvider>
            <AppSidebar groups={groups} />
            <SidebarInset className="min-w-0">
              <Header
                user={user}
                leftSlot={
                  <>
                    <SidebarTrigger className="-ml-1.5 [&_svg:not([class*='size-'])]:size-5" />
                    <Separator orientation="vertical" className="mr-2 h-5" />
                  </>
                }
              />
              <section className="flex grow flex-col p-2 pb-6 sm:p-4 sm:pb-12">
                <Outlet />
              </section>
              <Footer />
            </SidebarInset>
            <HelpSidebar />
          </HelpSidebarProvider>
        </SidebarProvider>
      </ActiveAccessGrantProvider>
    </AuthProvider>
  );
}
