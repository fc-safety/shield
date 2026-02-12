import { dehydrate, QueryClient } from "@tanstack/react-query";
import {
  BookOpenText,
  CircleHelp,
  FileSpreadsheet,
  MessageCircleMore,
  Package,
  RotateCcw,
  Route as RouteIcon,
  Trash,
} from "lucide-react";
import { data, Link, Outlet } from "react-router";
import { getAuthenticatedFetcher } from "~/.server/api-utils";
import { config } from "~/.server/config";
import { AppSidebar, type SidebarGroup } from "~/components/app-sidebar";
import Footer from "~/components/footer";
import Header from "~/components/header";
import HelpSidebar from "~/components/help-sidebar";
import InspectErrorBoundary from "~/components/inspections/inspect-error-boundary";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { DEFAULT_USER_ROUTES } from "~/components/user-dropdown-menu";
import { ActiveAccessGrantProvider } from "~/contexts/active-access-grant-context";
import { AuthProvider } from "~/contexts/auth-context";
import { HelpSidebarProvider } from "~/contexts/help-sidebar-context";
import { RequestedAccessContextProvider } from "~/contexts/requested-access-context";
import useMyOrganization from "~/hooks/use-my-organization";
import { CAPABILITIES } from "~/lib/permissions";
import { getMyClientAccessQueryOptions } from "~/lib/services/client-access.service";
import { getMyOrganizationQueryOptions } from "~/lib/services/clients.service";
import { can } from "~/lib/users";
import type { Route } from "./+types/layout";
import { getUserOrHandleInspectLoginRedirect } from "./.server/inspect-auth";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrHandleInspectLoginRedirect(request);

  const queryClient = new QueryClient();
  const fetcher = getAuthenticatedFetcher(request);
  const prefetchPromises = [
    queryClient.prefetchQuery(getMyOrganizationQueryOptions(fetcher)),
    queryClient.prefetchQuery(getMyClientAccessQueryOptions(fetcher)),
  ];

  await Promise.all(prefetchPromises);

  return data({
    user,
    apiUrl: config.API_BASE_URL,
    appHost: config.APP_HOST,
    googleMapsApiKey: config.GOOGLE_MAPS_API_KEY,
    clientId: config.CLIENT_ID,
    dehydratedState: dehydrate(queryClient),
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="bg-background flex h-full min-h-svh w-full flex-col">
      <Header
        showBreadcrumb={false}
        rightSlot={
          <>
            <Button variant="secondary" asChild>
              <Link to={"/logout"}>Logout</Link>
            </Button>
          </>
        }
      />
      <main className="grid grow place-items-center px-6 py-24 sm:py-32 lg:px-8">
        <InspectErrorBoundary error={error} />
      </main>
      <Footer />
    </div>
  );
}

export default function Layout({
  loaderData: { user, apiUrl, appHost, googleMapsApiKey, clientId },
}: Route.ComponentProps) {
  return (
    <AuthProvider
      user={user}
      apiUrl={apiUrl}
      appHost={appHost}
      googleMapsApiKey={googleMapsApiKey}
      clientId={clientId}
    >
      <ActiveAccessGrantProvider disableSwitching>
        <SidebarProvider defaultOpenState={{ help: false }}>
          <HelpSidebarProvider>
            <InspectionSidebar />
            <SidebarInset>
              <Header
                homeTo="/inspect"
                showBreadcrumb={false}
                user={user}
                userRoutes={DEFAULT_USER_ROUTES.map((r) => ({
                  ...r,
                  url: `/inspect${r.url}`,
                }))}
                logoutReturnTo="/inspect"
                leftSlot={
                  <>
                    <SidebarTrigger className="-ml-1.5" />
                    <Separator orientation="vertical" className="mr-1 h-5 sm:mr-2" />
                  </>
                }
              />
              <section className="flex w-full max-w-(--breakpoint-lg) grow flex-col self-center p-2 pt-2 pb-6 sm:p-4 sm:pb-12">
                <RequestedAccessContextProvider accessIntent="user">
                  <Outlet />
                </RequestedAccessContextProvider>
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

const InspectionSidebar = () => {
  const { user, client } = useMyOrganization();

  const groups: SidebarGroup[] = [
    {
      groupTitle: "Inspections",
      items: [
        {
          type: "link",
          title: "Inspect Asset",
          url: "/inspect",
          icon: FileSpreadsheet,
          exact: true,
        },
        {
          type: "link",
          title: "Routes",
          url: "/inspect/routes",
          icon: RouteIcon,
          exact: true,
          hide: !can(user, CAPABILITIES.MANAGE_ROUTES),
        },
        {
          type: "link",
          title: "Reorder Supplies",
          url: "/inspect/reorder-supplies",
          icon: Package,
        },
      ],
    },
    {
      groupTitle: "Demo Utilities",
      hide: !client?.demoMode,
      items: [
        {
          type: "link",
          title: "Clear Inspections",
          url: "/inspect/clear-demo-inspections",
          icon: Trash,
        },
        {
          type: "link",
          title: "Reset Inspections",
          url: "/inspect/reset-demo-inspections",
          icon: RotateCcw,
        },
      ],
    },
    {
      groupTitle: "Support",
      items: [
        {
          type: "link",
          title: "Contact Us",
          url: "/contact-us",
          icon: MessageCircleMore,
          external: true,
        },
        {
          type: "link",
          title: "FAQs",
          url: "/faqs",
          icon: CircleHelp,
          external: true,
        },
        {
          type: "link",
          title: "Docs",
          url: "/docs",
          icon: BookOpenText,
          external: true,
        },
      ],
    },
  ];

  return <AppSidebar groups={groups} />;
};
