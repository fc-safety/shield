import { redirect } from "react-router";
import { appStateSessionStorage } from "~/.server/sessions";
import { requireUserSession } from "~/.server/user-sesssion";
import { MARK_LEGACY_REDIRECT_VIEWED_QUERY_KEY } from "~/lib/constants";
import { getSearchParam } from "~/lib/utils";

const LOGIN_REQUIRED_ROUTES = ["/inspect/clear-demo-inspections"];

export async function getUserOrHandleInspectLoginRedirect(request: Request) {
  // If the user is being referred to from the legacy Tags page, we want to show
  // the legacy redirect landing page (unless it's been explicitly marked as viewed).
  const appStateSession = await appStateSessionStorage.getSession(request.headers.get("cookie"));
  if (appStateSession.get("show_legacy_redirect")) {
    throw redirect(
      `/legacy-redirect?returnTo=${encodeURIComponent(
        request.url
      )}&${MARK_LEGACY_REDIRECT_VIEWED_QUERY_KEY}`
    );
  }

  // Respond to the user intent (used if they are redirected from elsewhere).
  // Don't ask them if they want to login if the intent indicates they expect
  // to login.
  const intent = getSearchParam(request, "intent");

  // The public login route asks whether the user wants to login or view public
  // inspection data without logging in.
  let loginRoute: string | undefined = "/public-inspect/login";

  const pathname = URL.parse(request.url)?.pathname;

  if (
    intent === "register-tag" ||
    intent === "login" ||
    (pathname && LOGIN_REQUIRED_ROUTES.includes(pathname))
  ) {
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
