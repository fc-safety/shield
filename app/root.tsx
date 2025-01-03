import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useRouteLoaderData,
} from "react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbResponsive } from "@/components/breadcrumb-responsive";
import { ModeToggle } from "@/components/mode-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { AlertCircle, Home } from "lucide-react";
import type { PropsWithChildren } from "react";
import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from "remix-themes";
import { requireUserSession, themeSessionResolver } from "~/.server/sessions";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { cn, validateBreadcrumb } from "~/lib/utils";
import "~/tailwind.css";
import type { Route } from "./+types/root";

export async function loader({ request }: Route.LoaderArgs) {
  const { getTheme } = await themeSessionResolver(request);

  const { user, sessionToken } = await requireUserSession(request);

  return data(
    {
      theme: getTheme(),
      user,
    },
    {
      headers: {
        "Set-Cookie": sessionToken,
      },
    }
  );
}

export const links: Route.LinksFunction = () => [
  // { rel: "preconnect", href: "https://fonts.googleapis.com" },
  // {
  //   rel: "preconnect",
  //   href: "https://fonts.gstatic.com",
  //   crossOrigin: "anonymous",
  // },
  // {
  //   rel: "stylesheet",
  //   href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  // },
  {
    rel: "icon",
    type: "image/png",
    // sizes: "32x32",
    href: "https://fc-safety.com/wp-content/uploads/2017/08/favicon.png",
  },
];

export const meta: Route.MetaFunction = ({ matches }) => {
  let title = "Shield | FC Safety";

  const breadcrumb = matches
    .filter(validateBreadcrumb)
    .map((m) => m.handle.breadcrumb(m))
    .at(-1);
  if (breadcrumb?.label) {
    title = `${breadcrumb.label} | ${title}`;
  }
  return [{ title }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {error.status} {error.statusText}
        </AlertTitle>
        <AlertDescription>{error.data}</AlertDescription>
      </Alert>
    );
  } else {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Oops! Something went wrong.</AlertDescription>
      </Alert>
    );
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <ThemeProvider
      specifiedTheme={data?.theme ?? null}
      themeAction="/action/set-theme"
    >
      <BaseLayout>{children}</BaseLayout>
    </ThemeProvider>
  );
}

function BaseLayout({ children }: PropsWithChildren) {
  const data = useRouteLoaderData<typeof loader>("root");
  const [theme] = useTheme();
  const matches = useMatches();

  return (
    <html lang="en" className={cn(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data?.theme)} />
        <Links />
      </head>
      <body>
        <SidebarProvider>
          <AppSidebar user={data?.user} />
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
            <div className="flex flex-col p-2 sm:p-4 pt-0 grow">{children}</div>
            <Toaster position="top-right" />
          </SidebarInset>
        </SidebarProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
