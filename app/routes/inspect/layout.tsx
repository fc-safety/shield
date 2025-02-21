import { FileSpreadsheet, Route as RouteIcon } from "lucide-react";
import { data, Link, Outlet } from "react-router";
import { API_BASE_URL } from "~/.server/config";
import { requireUserSession } from "~/.server/sessions";
import {
  AppSidebar,
  DEFAULT_USER_ROUTES,
  type SidebarGroup,
} from "~/components/app-sidebar";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AuthProvider } from "~/contexts/auth-context";
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="bg-background w-full h-full min-h-svh flex flex-col">
      <Header
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
  loaderData: { user, apiUrl },
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
          title: "Manage Routes",
          url: "/inspect/routes",
          icon: RouteIcon,
          exact: true,
        },
      ],
    },
  ];

  return (
    <AuthProvider user={user} apiUrl={apiUrl}>
      <SidebarProvider>
        <AppSidebar
          groups={groups}
          userRoutes={DEFAULT_USER_ROUTES.map((r) => ({
            ...r,
            url: `/inspect${r.url}`,
          }))}
        />
        <SidebarInset>
          <Header
            homeTo="/inspect"
            leftSlot={
              <>
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </>
            }
          />
          <main className="flex flex-col items-center p-2 sm:p-4 pt-0 pb-6 sm:pb-12 grow">
            <Outlet />
          </main>
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
