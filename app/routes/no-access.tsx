import { AlertCircle, LogIn, LogOut } from "lucide-react";
import { redirect } from "react-router";
import { getUserSession } from "~/.server/user-sesssion";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { isTokenExpired, keycloakTokenPayloadSchema, parseToken } from "~/lib/users";
import type { Route } from "./+types/no-access";

export async function loader({ request }: Route.LoaderArgs) {
  const { tokens } = await getUserSession(request);

  if (!tokens || isTokenExpired(tokens.accessToken)) {
    throw redirect("/login");
  }

  const { name, email } = parseToken(
    tokens.accessToken,
    keycloakTokenPayloadSchema.pick({ name: true, email: true })
  );

  return { name: name ?? null, email };
}

export default function NoAccess({ loaderData: { name, email } }: Route.ComponentProps) {
  return (
    <div className="bg-background flex h-full min-h-svh w-full flex-col">
      <Header showBreadcrumb={false} />
      <main className="grid grow place-content-center px-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Access</AlertTitle>
            <AlertDescription>
              {name ? (
                <p>
                  Signed in as <strong>{name}</strong> ({email}).
                </p>
              ) : (
                <p>
                  Signed in as <strong>{email}</strong>.
                </p>
              )}
              <p className="mt-2">
                Your account has been authenticated, but you don&apos;t currently have access to
                Shield. Check your email for an organization invitation you may have missed, or
                contact your administrator to request access.
              </p>
            </AlertDescription>
          </Alert>
          <div className="flex w-full flex-col gap-3">
            <Button asChild className="w-full">
              <a href="/login">
                <LogIn />
                Try Again
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/logout">
                <LogOut />
                Sign Out
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
