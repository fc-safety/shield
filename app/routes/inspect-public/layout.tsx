import { ArrowLeft } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/layout";

export const loader = () => {
  return {};
};

export default function PublicInspectLayout({
  loaderData: {},
}: Route.ComponentProps) {
  const location = useLocation();
  const isLoginPage = location.pathname.split("/").pop() === "login";

  return (
    <div className="bg-background w-full h-full min-h-svh flex flex-col">
      <Header
        showBreadcrumb={false}
        leftSlot={
          !isLoginPage ? (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/public-inspect/login">
                <ArrowLeft />
              </Link>
            </Button>
          ) : null
        }
      />
      <main className="flex flex-col grow items-center px-4 sm:px-6 pb-6 sm:pb-12 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
