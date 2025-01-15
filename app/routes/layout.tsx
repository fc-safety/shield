import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbResponsive } from "@/components/breadcrumb-responsive";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { Home } from "lucide-react";
import { data, Outlet, useMatches } from "react-router";
import { requireUserSession } from "~/.server/sessions";
import Footer from "~/components/footer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { validateBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/layout";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, sessionToken } = await requireUserSession(request);

  return data(
    {
      user,
    },
    {
      headers: {
        "Set-Cookie": sessionToken,
      },
    }
  );
}

export default function Layout({ loaderData: { user } }: Route.ComponentProps) {
  const matches = useMatches();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbResponsive
              items={[
                {
                  to: "/",
                  label: <Home size={16} />,
                  id: "home",
                },
                ...matches.filter(validateBreadcrumb).map((match) => ({
                  id: match.id,
                  label: match.handle.breadcrumb(match).label,
                  to: match.pathname,
                })),
              ]}
            />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-2 sm:px-4">
            <ModeToggle />
          </div>
        </header>
        <main className="flex flex-col p-2 sm:p-4 pt-0 pb-6 sm:pb-12 grow">
          <Outlet />
        </main>
        <Footer />
        <Toaster position="top-right" />
      </SidebarInset>
    </SidebarProvider>
  );
}
