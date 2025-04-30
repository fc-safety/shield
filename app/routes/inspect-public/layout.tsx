import { ArrowLeft } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Link, Outlet, useLocation } from "react-router";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/layout";
import ShieldBannerLogo from "./components/shield-banner-logo";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <BaseLayout>
      <div className="flex flex-col grow items-center justify-center">
        <DefaultErrorBoundary
          error={error}
          homeTo="/public-inspect/login"
          contactTo="/public-inspect/contact"
        />
      </div>
    </BaseLayout>
  );
}

export default function PublicInspectLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname.split("/").pop() === "login";

  return (
    <BaseLayout showBackButton={!isLoginPage} showBannerLogo={!isLoginPage}>
      <Outlet />
    </BaseLayout>
  );
}

function BaseLayout({
  showBackButton = false,
  children,
  showBannerLogo = true,
}: PropsWithChildren<{
  showBackButton?: boolean;
  showBannerLogo?: boolean;
}>) {
  return (
    <div className="bg-background w-full h-full min-h-svh flex flex-col">
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
      />
      <main className="flex flex-col grow items-center px-4 sm:px-6 pb-6 sm:pb-12 lg:px-8">
        {showBannerLogo && <ShieldBannerLogo className="mb-12" />}
        {children}
      </main>
      <Footer />
    </div>
  );
}
