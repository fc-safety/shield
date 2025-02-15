import { data, Outlet } from "react-router";
import { API_BASE_URL } from "~/.server/config";
import { requireUserSession } from "~/.server/sessions";
import Footer from "~/components/footer";
import Header from "~/components/header";
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

export default function InspectLayout({
  loaderData: { user, apiUrl },
}: Route.ComponentProps) {
  return (
    <AuthProvider user={user} apiUrl={apiUrl}>
      <div className="min-h-svh w-full bg-background flex flex-col">
        <Header
          homeTo="/inspect"
          rightSlot={
            <>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </>
          }
        />
        <main className="flex-1 flex flex-col items-center p-2 sm:p-4 pt-0 pb-6 sm:pb-12">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
