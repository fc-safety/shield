import { FileSpreadsheet, Route as RouteIcon } from "lucide-react";
import { data, Link, Outlet } from "react-router";
import { config } from "~/.server/config";
import {
  AppSidebar,
  DEFAULT_USER_ROUTES,
  type SidebarGroup,
} from "~/components/app-sidebar";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import Footer from "~/components/footer";
import Header from "~/components/header";
import HelpSidebar from "~/components/help-sidebar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AuthProvider } from "~/contexts/auth-context";
import { HelpSidebarProvider } from "~/contexts/help-sidebar-context";
import { can } from "~/lib/users";
import type { Route } from "./+types/layout";
import { getUserOrHandleInspectLoginRedirect } from "./.server/inspect-auth";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserOrHandleInspectLoginRedirect(request);

  return data({
    user,
    apiUrl: config.API_BASE_URL,
    appHost: config.APP_HOST,
    googleMapsApiKey: config.GOOGLE_MAPS_API_KEY,
    clientId: config.CLIENT_ID,
  });
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="bg-background w-full h-full min-h-svh flex flex-col">
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
        <DefaultErrorBoundary
          error={error}
          homeTo="/inspect"
          contactTo="/inspect/contact"
        />
      </main>
      <Footer />
    </div>
  );
}

export default function Layout({
  loaderData: { user, apiUrl, appHost, googleMapsApiKey, clientId },
}: Route.ComponentProps) {
  const groups: SidebarGroup[] = [
    {
      groupTitle: "Inspections",
      items: [
        {
          title: "Inspect Asset",
          url: "/inspect",
          icon: FileSpreadsheet,
          exact: true,
        },
        {
          title: "Routes",
          url: "/inspect/routes",
          icon: RouteIcon,
          exact: true,
          hide: !can(user, "read", "inspection-routes"),
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
      clientId={clientId}
    >
      <SidebarProvider defaultOpenState={{ help: false }}>
        <HelpSidebarProvider>
          <AppSidebar
            groups={groups}
            userRoutes={DEFAULT_USER_ROUTES.map((r) => ({
              ...r,
              url: `/inspect${r.url}`,
            }))}
            logoutReturnTo="/inspect"
          />
          <SidebarInset>
            <Header
              homeTo="/inspect"
              showBreadcrumb={false}
              leftSlot={
                <>
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                </>
              }
            />
            <section className="flex flex-col p-2 sm:p-4 pt-0 pb-6 sm:pb-12 grow w-full max-w-(--breakpoint-lg) self-center">
              <Outlet />
            </section>
            <Footer />
          </SidebarInset>
          <HelpSidebar />
        </HelpSidebarProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
