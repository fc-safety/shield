import { redirect } from "react-router";
import { strategy } from "~/.server/authenticator";
import { CLIENT_ID, LOGOUT_URL } from "~/.server/config";
import { userSessionStorage } from "~/.server/sessions";
import type { Route } from "./+types/_auth.logout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await userSessionStorage.getSession(
    request.headers.get("cookie")
  );
  let logoutUrl: URL | null = null;

  const tokens = session.get("tokens");
  if (tokens) {
    await strategy.then((s) => s.revokeToken(tokens.accessToken));
    logoutUrl = URL.parse(LOGOUT_URL);
    logoutUrl?.searchParams.set("client_id", CLIENT_ID);

    const postLogoutUrl = URL.parse(request.url)?.origin ?? "";
    logoutUrl?.searchParams.set("post_logout_redirect_uri", postLogoutUrl);
  }

  return redirect(logoutUrl?.toString() ?? "/", {
    headers: { "Set-Cookie": await userSessionStorage.destroySession(session) },
  });
}
