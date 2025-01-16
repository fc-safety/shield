import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { data, Outlet } from "react-router";
import { requireUserSession } from "~/.server/sessions";
import Footer from "~/components/footer";
import Header from "~/components/header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
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
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
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
        <Toaster position="top-right" />
      </SidebarInset>
    </SidebarProvider>
  );
}
