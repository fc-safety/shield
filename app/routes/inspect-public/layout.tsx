import { ArrowLeft } from "lucide-react";
import type { PropsWithChildren } from "react";
import { data, Link, Outlet, useLocation } from "react-router";
import type { User } from "~/.server/authenticator";
import { getUserSession } from "~/.server/user-sesssion";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Button } from "~/components/ui/button";
import { UserDropdownMenu } from "~/components/user-dropdown-menu";
import type { Route } from "./+types/layout";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <BaseLayout>
      <div className="flex grow flex-col items-center justify-center">
        <DefaultErrorBoundary error={error} homeTo="/public-inspect/login" />
      </div>
    </BaseLayout>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getUserSession(request);
  return data({
    user,
  });
}

export default function PublicInspectLayout({ loaderData: { user } }: Route.ComponentProps) {
  const location = useLocation();
  const isLoginPage = location.pathname.split("/").pop() === "login";

  return (
    <BaseLayout showBackButton={!isLoginPage} showBannerLogo={!isLoginPage} user={user}>
      <Outlet />
    </BaseLayout>
  );
}

function BaseLayout({
  showBackButton = false,
  showBannerLogo = true,
  user,
  children,
}: PropsWithChildren<{
  showBackButton?: boolean;
  showBannerLogo?: boolean;
  user?: User | null;
}>) {
  return (
    <div className="bg-background flex h-full min-h-svh w-full flex-col">
      <Header
        showBreadcrumb={false}
        leftSlot={
          showBackButton ? (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/public-inspect/login">
                <ArrowLeft />
              </Link>
            </Button>
          ) : null
        }
        showBannerLogo={showBannerLogo}
        rightSlot={
          user ? <UserDropdownMenu user={user} logoutReturnTo="/public-inspect/login" /> : null
        }
      />
      <main className="flex grow flex-col items-center px-4 pb-6 sm:px-6 sm:pb-12 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
