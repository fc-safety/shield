import { redirect } from "react-router";
import { validateTagRequestAndBuildSession } from "~/.server/inspections";
import DefaultErrorBoundary from "~/components/default-error-boundary";
import Footer from "~/components/footer";
import Header from "~/components/header";
import type { Route } from "./+types/index";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <div className="bg-background w-full h-full min-h-svh flex flex-col">
      <Header showBreadcrumb={false} />
      <main className="grid grow place-items-center px-6 py-24 sm:py-32 lg:px-8">
        <DefaultErrorBoundary error={error} homeTo="/inspect" />
      </main>
      <Footer />
    </div>
  );
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  await validateTagRequestAndBuildSession(request, "/inspect");

  return redirect("/inspect");
};
