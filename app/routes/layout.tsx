import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
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
  return (
    <AuthProvider user={user} apiUrl={apiUrl}>
      <SidebarProvider>
        <AppSidebar />
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
