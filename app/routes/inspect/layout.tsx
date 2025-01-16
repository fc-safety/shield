import { data, Outlet } from "react-router";
import { requireUserSession } from "~/.server/sessions";
import Footer from "~/components/footer";
import Header from "~/components/header";
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

export default function InspectLayout({
  loaderData: { user },
}: Route.ComponentProps) {
  return (
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
  );
}
