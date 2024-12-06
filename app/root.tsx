import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useRouteLoaderData,
} from "@remix-run/react";

import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from "remix-themes";
import { themeSessionResolver } from "~/.server/sessions";
import { AppSidebar } from "~/components/app-sidebar";
import { BreadcrumbResponsive } from "~/components/breadcrumb-responsive";
import { ModeToggle } from "~/components/mode-toggle";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { cn, validateBreadcrumb } from "~/lib/utils";
import "~/tailwind.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const { getTheme } = await themeSessionResolver(request);
  return {
    theme: getTheme(),
  };
}

export const links: LinksFunction = () => [
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

export const meta: MetaFunction = ({ matches }) => {
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

function BaseLayout({ children }: { children: React.ReactNode }) {
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
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <BreadcrumbResponsive
                  items={[
                    {
                      to: "/",
                      label: "Home",
                      id: "home",
                    },
                    ...matches.filter(validateBreadcrumb).map((match) => ({
                      id: match.id,
                      label: match.handle.breadcrumb(match).label,
                      to: match.pathname,
                    })),
                  ]}
                />
                {/* <Breadcrumb>
                  <BreadcrumbList>
                    {matches.filter(validateBreadcrumb).map((match, index) => (
                      <li key={index}>
                        {index > 0 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                        <BreadcrumbItem className="hidden md:block">
                          <BreadcrumbLink asChild>
                            {match.handle.breadcrumb(match)}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </li>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb> */}
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2 px-4">
                <ModeToggle />
              </div>
            </header>
            <div className="flex flex-col p-4 pt-0 grow">{children}</div>
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
