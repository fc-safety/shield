import { AlertCircle, LogIn } from "lucide-react";
import { authenticator } from "~/.server/authenticator";
import { commitUserSession, getUserSession } from "~/.server/user-sesssion";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { getSearchParam } from "~/lib/utils";
import type { Route } from "./+types/login";
import { buildPath } from "~/lib/urls";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  authentication_failed: {
    title: "Sign-in Unsuccessful",
    description:
      "Something went wrong during sign-in. Please try again — it usually works on the next attempt.",
  },
  access_grant_fetch_failed: {
    title: "Failed to Get Identity Details",
    description:
      "We were able to verify your identity, but couldn't reach the Shield service to get your identity details. Please try again in a few moments.",
  },
};

const DEFAULT_ERROR = {
  title: "Authentication Error",
  description: "An unexpected error occurred during login. Please try again.",
};

export async function loader({ request }: Route.LoaderArgs) {
  const returnTo = getSearchParam(request, "returnTo");
  const loginHint = getSearchParam(request, "login_hint");

  const error = getSearchParam(request, "error");
  if (error) {
    return {
      error,
      returnTo,
      loginHint,
      errorMessage: getSearchParam(request, "error_description"),
    };
  }

  if (returnTo) {
    const { session } = await getUserSession(request);
    if (session) {
      session.set("returnTo", returnTo);
      await commitUserSession(session);
    }
  }

  await authenticator.then((a) => a.authenticate("oauth2", request));
  return { error: null };
}

export default function Login({
  loaderData: { error, returnTo, loginHint },
}: Route.ComponentProps) {
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
            <a
              href={buildPath("/login", {
                returnTo: returnTo ?? undefined,
                login_hint: loginHint ?? undefined,
              })}
            >
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
