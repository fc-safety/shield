import { requireUserSession } from "~/.server/user-sesssion";
import { getSearchParam } from "~/lib/utils";

export async function getUserOrHandleInspectLoginRedirect(request: Request) {
  // Respond to the user intent (used if they are redirected from elsewhere).
  // Don't ask them if they want to login if the intent indicates they expect
  // to login.
  const intent = getSearchParam(request, "intent");

  // The public login route asks whether the user wants to login or view public
  // inspection data without logging in.
  let loginRoute: string | undefined = "/public-inspect/login";

  if (intent === "register-tag") {
    // Use default login route if the intent is to register a tag, which
    // requires a login.
    loginRoute = undefined;
  }

  // For public access (when no user is logged in), redirect to a special login page
  // that gives the anonymous user the opportunity to view public inspection data.
  const { user } = await requireUserSession(request, {
    loginRoute,
  });

  return user;
}
