import { Building2, Check, Clock, XCircle } from "lucide-react";
import { redirect, useFetcher } from "react-router";
import { ApiFetcher } from "~/.server/api-utils";
import {
  applyAccessGrantToSession,
  commitUserSession,
  fetchCurrentUser,
  getActiveUserSession,
} from "~/.server/user-sesssion";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { AcceptInvitationResult, InvitationValidation } from "~/lib/types";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/accept-invite.$code";

export const handle = {
  breadcrumb: () => ({ label: "Accept Invitation" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const code = params.code;

  if (!code) {
    throw new Response("Invitation code is required", { status: 400 });
  }

  // Check if user is logged in
  const session = await getActiveUserSession(request);
  const isAuthenticated = !!session?.user;

  // Validate the invitation (public endpoint)
  try {
    const validation = await ApiFetcher.create(
      request,
      `/invitations/validate/${code}`
    ).get<InvitationValidation>({ bypassAuth: true });

    return {
      code,
      validation,
      isAuthenticated,
      loginUrl: `/login?returnTo=${encodeURIComponent(`/accept-invite/${code}`)}`,
    };
  } catch (error) {
    // Handle 404 or 410 errors
    if (error instanceof Response) {
      if (error.status === 404) {
        return {
          code,
          validation: null,
          error: "not_found",
          isAuthenticated,
          loginUrl: `/login?returnTo=${encodeURIComponent(`/accept-invite/${code}`)}`,
        };
      }
      if (error.status === 410) {
        return {
          code,
          validation: null,
          error: "expired",
          isAuthenticated,
          loginUrl: `/login?returnTo=${encodeURIComponent(`/accept-invite/${code}`)}`,
        };
      }
    }
    throw error;
  }
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { session } = await getActiveUserSession(request);
  const tokens = session?.get("tokens");
  if (!session || !tokens) {
    throw new Response("Not authenticated", { status: 401 });
  }

  const code = params.code;

  if (!code) {
    throw new Response("Invitation code is required", { status: 400 });
  }

  try {
    const result = await ApiFetcher.create(
      request,
      `/invitations/${code}/accept`
    ).post<AcceptInvitationResult>({ allowEmptyAccessGrant: true });

    const currentUser = await fetchCurrentUser(tokens.accessToken, {
      clientId: result.clientAccess.clientId,
      siteId: result.clientAccess.siteId,
    });

    if (currentUser.accessGrant) {
      applyAccessGrantToSession(session, currentUser.accessGrant);
      await commitUserSession(session);
    }

    // Redirect to the app after successful acceptance
    return redirect("/my-organization?welcome=true");
  } catch (error) {
    if (error instanceof Response) {
      const body = await error.json().catch(() => ({}));
      return {
        success: false,
        error: body.message || "Failed to accept invitation",
      };
    }
    throw error;
  }
};

export default function AcceptInvite({
  loaderData: { code, validation, error, isAuthenticated, loginUrl },
  actionData,
}: Route.ComponentProps) {
  const fetcher = useFetcher();
  const isAccepting = fetcher.state === "submitting";

  // Error states
  if (error === "not_found") {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <XCircle className="text-destructive h-6 w-6" />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <a href="/">Go to Home</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error === "expired") {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation has expired. Please contact the organization administrator for a new
              invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <a href="/">Go to Home</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!validation) {
    return null;
  }

  // Action error
  const acceptError = actionData?.error;

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Building2 className="text-primary h-6 w-6" />
          </div>
          <CardTitle className="self-center">You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{validation.client.name}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span className="font-medium">{validation.client.name}</span>
              </div>
              {validation.hasPreassignedRole && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">Pre-assigned</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium">
                  {new Date(validation.expiresOn).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {validation.restrictedToEmail && (
            <p className="text-muted-foreground text-center text-sm">
              This invitation is restricted to a specific email address.
            </p>
          )}

          {acceptError && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-center text-sm">
              {acceptError}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {isAuthenticated ? (
            <fetcher.Form method="post" className="w-full">
              <Button type="submit" className="w-full" disabled={isAccepting}>
                {isAccepting ? (
                  "Accepting..."
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            </fetcher.Form>
          ) : (
            <>
              <Button asChild className="w-full">
                <a href={loginUrl}>
                  <Check className="mr-2 h-4 w-4" />
                  Sign in to Accept
                </a>
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                You need to sign in to accept this invitation.
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
