import { createId } from "@paralleldrive/cuid2";
import { redirect } from "react-router";
import { authenticator, type Tokens } from "~/.server/authenticator";
import { getSession, userSessionStorage } from "~/.server/sessions";
import {
  applyAccessGrantToSession,
  commitUserSession,
  fetchCurrentUser,
} from "~/.server/user-sesssion";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  let tokens: Tokens;
  try {
    tokens = await authenticator.then((a) => a.authenticate("oauth2", request));
  } catch (e) {
    return redirect("/login");
  }

  const session = await getSession(request, userSessionStorage);
  if (!session.has("id")) {
    session.set("id", createId());
  }
  session.set("tokens", tokens);

  // Fetch permissions from backend - this is required for login to complete
  try {
    const currentUser = await fetchCurrentUser(tokens.accessToken, {
      clientId: session.get("activeClientId"),
      siteId: session.get("activeSiteId"),
    });

    if (currentUser.accessGrant) {
      applyAccessGrantToSession(session, currentUser.accessGrant);
    }
  } catch (error) {
    console.error("Failed to fetch current user on login:", error);
    // Clear tokens and redirect to login with error to prevent infinite loop
    // The user authenticated with the IdP but we can't reach our backend
    session.unset("tokens");
    await commitUserSession(session);
    return redirect("/login?error=backend_unavailable");
  }

  const returnTo = session.get("returnTo") ?? "/";
  session.unset("returnTo");

  await commitUserSession(session);

  return redirect(returnTo);
}
