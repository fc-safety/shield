import { Home } from "lucide-react";
import { data, Outlet, useMatches } from "react-router";
import { requireUserSession } from "~/.server/sessions";
import { BreadcrumbResponsive } from "~/components/breadcrumb-responsive";
import Footer from "~/components/footer";
import { ModeToggle } from "~/components/mode-toggle";
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

export default function InspectLayout({
  loaderData: { user },
}: Route.ComponentProps) {
  const matches = useMatches();

  return (
    <div className="min-h-svh w-full bg-background flex flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-2 sm:px-4">
          <BreadcrumbResponsive
            items={[
              {
                to: "/inspect",
                label: <Home size={16} />,
                id: "inspect-home",
              },
              ...matches.filter(validateBreadcrumb).map((match) => ({
                id: match.id,
                label: match.handle.breadcrumb(match).label,
                to: match.pathname,
              })),
            ]}
          />
        </div>
        <div className="flex items-center gap-2 px-2 sm:px-4">
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center p-2 sm:p-4 pt-0 pb-6 sm:pb-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
