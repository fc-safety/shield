import { AlertCircle, LogIn } from "lucide-react";
import { authenticator } from "~/.server/authenticator";
import { userSessionStorage } from "~/.server/sessions";
import { commitUserSession } from "~/.server/user-sesssion";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/login";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  backend_unavailable: {
    title: "Service Unavailable",
    description:
      "We were able to verify your identity, but couldn't reach the Shield service. Please try again in a few moments.",
  },
};

const DEFAULT_ERROR = {
  title: "Authentication Error",
  description: "An unexpected error occurred during login. Please try again.",
};

export async function loader({ request }: Route.LoaderArgs) {
  const returnTo = getSearchParam(request, "returnTo");

  const error = getSearchParam(request, "error");
  if (error) {
    return { error, returnTo };
  }

  if (returnTo) {
    const session = await userSessionStorage.getSession(request.headers.get("cookie"));
    session.set("returnTo", returnTo);
    await commitUserSession(session);
  }

  await authenticator.then((a) => a.authenticate("oauth2", request));
  return { error: null };
}

export default function Login({ loaderData: { error, returnTo } }: Route.ComponentProps) {
  const errorInfo = error ? (ERROR_MESSAGES[error] ?? DEFAULT_ERROR) : null;

  return (
    <div className="bg-background flex h-full min-h-svh w-full flex-col">
      <Header showBreadcrumb={false} />
      <main className="grid grow place-content-center px-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          {errorInfo && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{errorInfo.title}</AlertTitle>
              <AlertDescription>{errorInfo.description}</AlertDescription>
            </Alert>
          )}
          <Button asChild className="w-full">
            <a href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}>
              <LogIn />
              Try Again
            </a>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
