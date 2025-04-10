import {
  data,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import { type PropsWithChildren } from "react";
import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from "remix-themes";
import { themeSessionResolver } from "~/.server/sessions";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/root";
import DefaultErrorBoundary from "./components/default-error-boundary";
import Footer from "./components/footer";
import Header from "./components/header";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import QueryContext from "./contexts/query-context";
import { FONT_AWESOME_VERSION } from "./lib/constants";
import styles from "./tailwind.css?url";

export async function loader({ request }: Route.LoaderArgs) {
  const { getTheme } = await themeSessionResolver(request);
  return data({
    theme: getTheme(),
  });
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
  { rel: "stylesheet", href: styles },
  {
    rel: "stylesheet",
    href: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${FONT_AWESOME_VERSION}/css/all.min.css`,
    integrity:
      "sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==",
    crossOrigin: "anonymous",
    referrerPolicy: "no-referrer",
  },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  // Fallback to png if svg is not supported
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-light.png",
    media: "(prefers-color-scheme: light)",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-dark.png",
    media: "(prefers-color-scheme: dark)",
  },
  // Fallback icon
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
  // Apple Touch Icon
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/apple_touch_icon-180x180.png",
    media: "(prefers-color-scheme: light)",
  },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/apple_touch_icon-180x180-dark.png",
    media: "(prefers-color-scheme: dark)",
  },
  // Apple Touch Icon Fallback
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/apple_touch_icon-180x180.png",
  },
];

export const meta: Route.MetaFunction = () => {
  return [{ title: "Shield | FC Safety" }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="w-full h-full min-h-svh flex flex-col">
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
        <DefaultErrorBoundary error={error} />
      </main>
      <Footer />
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <ThemeProvider
      specifiedTheme={data?.theme ?? null}
      themeAction="/action/set-theme"
    >
      <QueryContext>
        <BaseLayout>{children}</BaseLayout>
      </QueryContext>
    </ThemeProvider>
  );
}

function BaseLayout({ children }: PropsWithChildren) {
  const data = useRouteLoaderData<typeof loader>("root");
  const [theme] = useTheme();

  return (
    <html lang="en" className={cn(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(data?.theme)} />
        <Links />
      </head>
      <body className="bg-background">
        {children}
        <ScrollRestoration />
        <Scripts />
        <div id="dialog-portal"></div>
        <Toaster position="top-right" className="pointer-events-auto" />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
