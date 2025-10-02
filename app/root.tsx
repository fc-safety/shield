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

import { dehydrate, QueryClient } from "@tanstack/react-query";
import { enableMapSet } from "immer";
import { type PropsWithChildren } from "react";
import { PreventFlashOnWrongTheme, ThemeProvider, useTheme } from "remix-themes";
import {
  appStateSessionStorage,
  setCookieResponseHeaders,
  themeSessionResolver,
} from "~/.server/sessions";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/root";
import { getAuthenticatedFetcher } from "./.server/api-utils";
import { buildImageProxyUrl } from "./.server/images";
import { requestContext } from "./.server/request-context";
import DefaultErrorBoundary from "./components/default-error-boundary";
import Footer from "./components/footer";
import Header from "./components/header";
import SplashScreen from "./components/splash-screen";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { AppStateProvider } from "./contexts/app-state-context";
import {
  OptimizedImageProvider,
  type OptimizedImageUrls,
} from "./contexts/optimized-image-context";
import QueryContext from "./contexts/query-context";
import globalStyles from "./global.css?url";
import { BANNER_LOGO_DARK_URL, BANNER_LOGO_LIGHT_URL } from "./lib/constants";
import { getMyOrganizationQueryOptions } from "./lib/services/clients.service";
import styles from "./tailwind.css?url";

enableMapSet();

export const unstable_middleware = [
  requestContext.create,
  // `setCookieResponseHeaders` requires `requestContext.create` to be run first.
  setCookieResponseHeaders,
];

export async function loader({ request }: Route.LoaderArgs) {
  const { getTheme } = await themeSessionResolver(request);

  const appStateSession = await appStateSessionStorage.getSession(request.headers.get("cookie"));

  const optimizedImageUrls: OptimizedImageUrls = {
    bannerLogoLight: {
      h48px: buildImageProxyUrl(BANNER_LOGO_LIGHT_URL, ["h:48"]),
    },
    bannerLogoDark: {
      h48px: buildImageProxyUrl(BANNER_LOGO_DARK_URL, ["h:48"]),
    },
  };

  const queryClient = new QueryClient();
  const fetcher = getAuthenticatedFetcher(request);
  const prefetchPromises = [queryClient.prefetchQuery(getMyOrganizationQueryOptions(fetcher))];

  await Promise.all(prefetchPromises);

  return data({
    theme: getTheme(),
    appState: appStateSession.data,
    optimizedImageUrls,
    dehydratedState: dehydrate(queryClient),
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
  { rel: "stylesheet", href: globalStyles },
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

  // FONT AWESOME
  {
    rel: "stylesheet",
    href: "https://kit.fontawesome.com/02452665a9.css",
    crossOrigin: "anonymous",
  },
];

export const meta: Route.MetaFunction = () => {
  return [{ title: "Shield | FC Safety" }];
};

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="bg-background flex h-full min-h-svh w-full flex-col">
      <Header
        showBreadcrumb={false}
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

  if (!data) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
      <OptimizedImageProvider optimizedImageUrls={data.optimizedImageUrls}>
        <AppStateProvider appState={data.appState}>
          <QueryContext>
            <BaseLayout>{children}</BaseLayout>
          </QueryContext>
        </AppStateProvider>
      </OptimizedImageProvider>
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

        {/* Help Scout Chat Beacon */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
          !function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});`,
          }}
        />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
            window.Beacon('init', 'f023be77-9718-4c96-a230-68481b68dfd4');
            window.Beacon('once', 'ready', () => {
            var beaconContainer = document.querySelector('#beacon-container');
              if (beaconContainer) {
                beaconContainer.style.opacity = '0';
                beaconContainer.style.pointerEvents = 'none';
              }
            });
            `,
          }}
        />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
